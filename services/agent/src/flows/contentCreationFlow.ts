/**
 * Content Creation Flow
 * 
 * Multi-phase agentic workflow for generating educational videos using Manim.
 * 
 * FLOW PHASES:
 * 1. Research - Gather information about the topic using contentResearcher
 * 2. Script Generation - Create detailed educational script from research
 * 3. Code Generation - Generate Manim Python code from script
 * 4. Code Evaluation - Validate code using evaluator agent
 * 5. Code Refinement - Fix issues if evaluation fails (max 3 iterations)
 * 6. Video Generation - Submit video job (ASYNC - returns immediately)
 * 7. Completion - Return job_id for frontend polling
 */

import { Experimental_Agent as Agent } from 'ai';
import type { UserContext } from '../mcpClient';
import { contentResearcher } from '../agent/contentResearcher';
import { evaluateManimCode, type CodeEvaluationResult } from '../agent/codeEvaluator';
import type { Response } from 'express';
import {
    addUserMessage,
    initializeAgentMessage,
    addStepToAgentMessage,
    finalizeAgentMessage,
    convertChunkToStep
} from '../utils/chatUtils';
import { extractFilesFromQuery } from '../utils/fileExtractor';
import dotenv from 'dotenv'
import axios from 'axios';
import { models, get_model } from '../llm_models';

dotenv.config();

const MANIM_RENDERER_URL = process.env.MANIM_RENDERER_URL || 'http://localhost:3004';

export interface ContentCreationOptions {
    query: string;
    research_mode?: 'simple' | 'moderate' | 'deep';
    systemPromptResearch?: string;
    userContext: UserContext;
    res: Response;
}

const MAX_REFINEMENT_ITERATIONS = 2;

export async function contentCreationFlow(
    options: ContentCreationOptions
): Promise<void> {
    const { query, userContext, res, research_mode = 'moderate', systemPromptResearch } = options;

    const startTime = Date.now();
    let stepNumber = 0;
    let toolCallCount = 0;
    let researchFindings = '';
    let manimCode = '';
    const researchedWebsites = new Set<string>();
    const fileExtraction = extractFilesFromQuery(query);
    const actualQuery = fileExtraction.hasFiles ? fileExtraction.cleanedQuery : query;

    try {
        // Add user message to database
        await addUserMessage(
            userContext.chatId,
            query,
            fileExtraction.extractedFiles,
            userContext
        );

        // Initialize agent message
        const messageId = await initializeAgentMessage(
            userContext.chatId,
            'content_generation',
            fileExtraction.extractedFiles
        );

        // ====== PHASE 1: RESEARCH ======
        for await (const result of contentResearcher({
            query: actualQuery,
            userContext,
            research_mode,
            inputFiles: fileExtraction.extractedFiles,
            ...(systemPromptResearch && { systemPrompt: systemPromptResearch })
        })) {
            const chunk = { phase: 'research', ...result.chunk };
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);

            // Track tool calls
            if (result.chunk.type === 'tool-input-available') {
                toolCallCount++;
            }

            // Store step in database
            const step = convertChunkToStep(result.chunk, 'research', stepNumber + 1);
            if (step) {
                stepNumber++;
                await addStepToAgentMessage(userContext.chatId, messageId, step);
            }

            researchFindings = result.fullText;
        }

        // ====== PHASE 2: CODE GENERATION (directly from research) ======
        const codePrompt = `You are a Manim animation expert. Generate concise Manim Python code to animate the key ideas below.

        TOPIC: ${query}
        RESEARCH SUMMARY (bulleted, compact):
        ${researchFindings}

        REQUIREMENTS:
        - Use "from manim import *" at the top
        - Create one Scene subclass implementing construct()
        - Prefer simple animations: Create, Write, FadeIn, FadeOut, Transform
        - Insert self.wait(1) between major steps
        - Use clear positioning and colors; avoid excessive comments
        - Aim for <= 60 seconds total
        - Output ONLY Python code (no markdown)`;

        const codeAgent = new Agent({
            model: get_model(models.code_generator.provider, models.code_generator.model),
            system: codePrompt,
            tools: {},
            temperature: 0.5
        });

        const codeResult = await codeAgent.stream({ prompt: 'Generate the Manim code now.' });
        const codeStream = codeResult.toUIMessageStream();

        for await (const chunk of codeStream) {
            const phaseChunk = { phase: 'code', ...chunk };
            res.write(`data: ${JSON.stringify(phaseChunk)}\n\n`);

            if (chunk.type === 'text-delta' && chunk.delta) {
                manimCode += chunk.delta;
            }

            const step = convertChunkToStep(chunk, 'code', stepNumber + 1);
            if (step) {
                stepNumber++;
                await addStepToAgentMessage(userContext.chatId, messageId, step);
            }
        }

        // Clean up code if wrapped in markdown
        manimCode = manimCode.trim();
        if (manimCode.startsWith('```python')) {
            manimCode = manimCode.replace(/```python\n/, '').replace(/\n```$/, '');
        } else if (manimCode.startsWith('```')) {
            manimCode = manimCode.replace(/```\n/, '').replace(/\n```$/, '');
        }

        // ====== PHASE 3 & 4: CODE EVALUATION & REFINEMENT LOOP ======
        let refinementIteration = 0;
        let codeEvaluation: CodeEvaluationResult | null = null;
        let codeIsValid = false;

        while (refinementIteration < MAX_REFINEMENT_ITERATIONS) {
            // Evaluate the code
            codeEvaluation = await evaluateManimCode(manimCode);

            // Send evaluation result to client
            res.write(`data: ${JSON.stringify({
                type: 'evaluation',
                phase: 'evaluation',
                iteration: refinementIteration + 1,
                isValid: codeEvaluation.isValid,
                errors: codeEvaluation.errors,
                warnings: codeEvaluation.warnings
            })}\n\n`);

            stepNumber++;
            await addStepToAgentMessage(userContext.chatId, messageId, {
                step: stepNumber,
                phase: 'evaluation',
                type: 'text',
                chunkData: `Evaluation ${refinementIteration + 1}: ${codeEvaluation.isValid ? 'PASSED ✓' : 'FAILED ✗'}\nErrors: ${codeEvaluation.errors.join(', ') || 'None'}\nWarnings: ${codeEvaluation.warnings.join(', ') || 'None'}`,
                timestamp: new Date()
            });

            if (codeEvaluation.isValid) {
                codeIsValid = true;
                break;
            }

            // Need refinement
            refinementIteration++;

            if (refinementIteration >= MAX_REFINEMENT_ITERATIONS) {
                res.write(`data: ${JSON.stringify({
                    type: 'warning',
                    phase: 'evaluation',
                    message: 'Maximum refinement iterations reached. Proceeding with current code.'
                })}\n\n`);
                break;
            }

            // Refine the code
            const refinementPrompt = `Fix the errors in this Manim code.

            CURRENT CODE:
            ${manimCode}

            ERRORS:
            ${codeEvaluation.errors.join('\n')}

            WARNINGS:
            ${codeEvaluation.warnings.join('\n')}

            SUGGESTIONS:
            ${codeEvaluation.suggestions.join('\n')}

            Generate the corrected Python code with all issues fixed. Output ONLY the code, no explanations or markdown.`;

            const refinementAgent = new Agent({
                model: get_model(models.code_refinement_agent.provider, models.code_refinement_agent.model),
                system: refinementPrompt,
                tools: {},
                temperature: 0.3
            });

            const refinementResult = await refinementAgent.stream({ prompt: 'Fix the code now.' });
            const refinementStream = refinementResult.toUIMessageStream();

            let refinedCode = '';
            for await (const chunk of refinementStream) {
                const phaseChunk = { phase: 'refinement', ...chunk };
                res.write(`data: ${JSON.stringify(phaseChunk)}\n\n`);

                if (chunk.type === 'text-delta' && chunk.delta) {
                    refinedCode += chunk.delta;
                }

                const step = convertChunkToStep(chunk, 'refinement', stepNumber + 1);
                if (step) {
                    stepNumber++;
                    await addStepToAgentMessage(userContext.chatId, messageId, step);
                }
            }

            // Update manimCode with refined version
            manimCode = refinedCode.trim();
            if (manimCode.startsWith('```python')) {
                manimCode = manimCode.replace(/```python\n/, '').replace(/\n```$/, '');
            } else if (manimCode.startsWith('```')) {
                manimCode = manimCode.replace(/```\n/, '').replace(/\n```$/, '');
            }
        }

        // ====== PHASE 5: VIDEO GENERATION (ASYNC) ======
        res.write(`data: ${JSON.stringify({
            type: 'phase-start',
            phase: 'video',
            message: 'Starting video generation (this may take a few minutes)...'
        })}\n\n`);

        const sceneName = codeEvaluation?.sceneName || undefined;

        // Call the Manim renderer API directly
        let jobId = '';
        let videoStarted = false;

        try {
            const renderPayload = {
                code: manimCode,
                scene_name: sceneName,
                quality: 'medium_quality',
                format: 'mp4',
                timeout: 300,
                user_id: userContext.userId,
                chat_id: userContext.chatId,
                classroom_id: userContext.classroomId,
                subject_id: userContext.subjectId
            };

            res.write(`data: ${JSON.stringify({
                type: 'video-request',
                phase: 'video',
                message: 'Submitting video generation request...'
            })}\n\n`);

            const renderResponse = await axios.post<{ job_id: string; message: string }>(
                `${MANIM_RENDERER_URL}/render`,
                renderPayload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10 second timeout for the API call
                }
            );

            jobId = renderResponse.data.job_id || '';
            videoStarted = !!jobId;

            // Notify user that video is processing
            if (videoStarted) {
                res.write(`data: ${JSON.stringify({
                    type: 'video-processing',
                    phase: 'video',
                    job_id: jobId,
                    message: 'Video generation started! This will take a few minutes. You can safely leave this page and come back later to view the video.'
                })}\n\n`);
            }

        } catch (error) {
            console.error('Failed to start video generation:', error);
            res.write(`data: ${JSON.stringify({
                type: 'error',
                phase: 'video',
                message: `Failed to start video generation: ${error instanceof Error ? error.message : 'Unknown error'}`
            })}\n\n`);
        }

        stepNumber++;
        await addStepToAgentMessage(userContext.chatId, messageId, {
            step: stepNumber,
            phase: 'video',
            type: 'text',
            chunkData: videoStarted
                ? `✓ Video generation started!\nJob ID: ${jobId}\nStatus: Processing (check back in a few minutes)`
                : `✗ Failed to start video generation`,
            timestamp: new Date()
        });

        // ====== PHASE 6: COMPLETION ======
        const duration = Date.now() - startTime;
        const finalMessage = `✅ Content creation workflow completed!\n\nRefinement iterations: ${refinementIteration}\nCode validation: ${codeIsValid ? 'Passed' : 'Completed with warnings'}\nVideo generation: ${videoStarted ? 'Started (processing in background)' : 'Failed to start'}\nJob ID: ${jobId || 'N/A'}\nTotal time: ${(duration / 1000).toFixed(2)}s\n\n💡 The video is being generated. You can close this page and come back later to view it.`;

        stepNumber++;
        await addStepToAgentMessage(userContext.chatId, messageId, {
            step: stepNumber,
            phase: 'completion',
            type: 'text',
            chunkData: finalMessage,
            timestamp: new Date()
        });

        // Store job_id in the finalized message for frontend to poll
        await finalizeAgentMessage(
            userContext.chatId,
            messageId,
            researchFindings,
            Array.from(researchedWebsites),
            JSON.stringify({
                code: manimCode,
                video_job_id: jobId,
                video_status: 'processing'
            }),
            {
                success: videoStarted,
                totalToolCalls: toolCallCount,
                totalTextLength: researchFindings.length + manimCode.length,
                duration,
                errorCount: codeIsValid ? 0 : 1,
                finalStatus: 'completed'
            }
        );

        res.write(`data: ${JSON.stringify({
            type: 'done',
            phase: 'completion',
            video_job_id: jobId,
            message: 'Workflow complete. Video is generating in background.'
        })}\n\n`);
        res.end();

    } catch (error) {
        console.error('Content creation flow error:', error);
        res.write(`data: ${JSON.stringify({
            type: 'error',
            phase: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        })}\n\n`);
        res.end();
    }
}