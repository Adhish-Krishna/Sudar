/**
 * Content Creation Flow
 * 
 * Multi-phase agentic workflow for generating educational videos using Manim.
 * 
 * Simplified FLOW:
 * 1. Research - Gather information about the topic using `contentResearcher` agent
 * 2. Code generation - Generate code using code generator agent
 * 3. Validate - POST code to {MANIM_RENDERER_URL}/validate
 * 4. If valid -> POST to {MANIM_RENDERER_URL}/render to start job
 * 5. If invalid -> pass validator feedback back to code generation agent and repeat (max iterations)
 * 6. On success, return job_id for frontend polling
 */

import { generateObject } from 'ai';
import type { UserContext } from '../mcpClient';
import { contentResearcher } from '../agent/contentResearcher';
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
import { startHeartbeat } from '../utils/streamUtils';
import axios from 'axios';
import { models, get_model } from '../llm_models';
// zod used by shared schemas
import { CodeOutputSchema, type CodeOutput } from '../schemas/codeOutputSchema';

dotenv.config();

const MANIM_RENDERER_URL = process.env.MANIM_RENDERER_URL || 'http://localhost:3004';

export interface ContentCreationOptions {
    query: string;
    research_mode?: 'simple' | 'moderate' | 'deep';
    systemPromptResearch?: string;
    userContext: UserContext;
    res: Response;
}

const MAX_REFINE_ITERATIONS = 3;

function sanitizeManimCode(code: string): string {
    let cleaned = code.trim();
    // Remove triple backticks and python language marker
    cleaned = cleaned.replace(/```\s*python\n?/i, '').replace(/```/g, '');
    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();
    // Ensure import present
    if (!/^\s*from\s+manim\s+import\s+\*/m.test(cleaned)) {
        cleaned = `from manim import *\n\n${cleaned}`;
    }
    return cleaned;
}

export async function contentCreationFlow(
    options: ContentCreationOptions
): Promise<void> {
    const { query, userContext, res, research_mode, systemPromptResearch } = options;

    const startTime = Date.now();
    let stepNumber = 0;
    let toolCallCount = 0;
    let researchFindings = '';
    let manimCode = '';
    const researchedWebsites = new Set<string>();
    const fileExtraction = extractFilesFromQuery(query);
    const actualQuery = fileExtraction.hasFiles ? fileExtraction.cleanedQuery : query;

    let messageId: string | undefined;
    let stopHeartbeat: (() => void) | null = null;
    try {
        // Add user message to database
        await addUserMessage(
            userContext.chatId,
            query,
            fileExtraction.extractedFiles,
            userContext
        );

        // Initialize agent message
        messageId = await initializeAgentMessage(
            userContext.chatId,
            'content_creation',
            fileExtraction.extractedFiles
        );

        // ====== PHASE 1: RESEARCH ======
        // Start server heartbeat to keep SSE alive during long operations
        stopHeartbeat = startHeartbeat(res, 10000);
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

        // ====== PHASE 2: SIMPLIFIED CODE GENERATION + VALIDATE/RENDER LOOP ======
        // We will loop: generate code -> validate -> if valid -> render, else pass validate output back to generator.
        let iterate = 0;
        let validationResponse: any = null;
        let jobId = '';
        let videoStarted = false;
        let validationFeedback = '';

        while (iterate < MAX_REFINE_ITERATIONS && !videoStarted) {
            // Build a prompt for the code generator. We ask for JSON output: { code: string, sceneName?: string }
            const codeSystemPromptParts = [
                `You are a Manim animation expert. Based on the research summary and the user query, generate a concise Manim Python script.`,
                `TOPIC: ${query}`,
                `RESEARCH SUMMARY (compact):\n${researchFindings}`,
                `Use the validation feedback to correct the code: \n ${validationFeedback.length > 0? validationFeedback : ''}`,
                'REQUIREMENTS:\n- Use "from manim import *" at the top\n- Create one Scene subclass implementing construct()\n- Prefer simple animations: Create, Write, FadeIn, FadeOut, Transform\n- Insert self.wait(1) between major steps\n- Aim for <= 60 seconds total',
                'OUTPUT: Respond with JSON only: { "code": "<python code>", "sceneName": "<SceneName or empty>" }'
            ];
            
            // Reuse central schema for code output validation
            // const CodeOutputSchema = z.object({ code: z.string(), sceneName: z.string() });
            let code: string = '';
            let sceneName: string = '';
            try {
                const { object } = await generateObject({
                    model: get_model(models.code_generator.provider, models.code_generator.model),
                    system: codeSystemPromptParts.join('\n\n'),
                    prompt: `Generate the Manim code now.`,
                    schema: CodeOutputSchema,
                });
                if (object) {
                    const result: CodeOutput = object;
                    code = result.code;
                    sceneName = result.sceneName || '';
                }
            } catch (err) {
                    console.log(err);
            }

            manimCode = sanitizeManimCode((code.length>0?code:''));

            // Store a single code generation step to DB (non-streaming)
            stepNumber++;
            await addStepToAgentMessage(userContext.chatId, messageId, {
                step: stepNumber,
                phase: 'generation',
                type: 'code',
                chunkData: { code: manimCode, scene: sceneName },
                timestamp: new Date()
            });

            // Validate with renderer
            let validateResult: any = null;
            try {
                const validateResp = await axios.post(`${MANIM_RENDERER_URL}/validate`, { code: manimCode }, { timeout: 5000 });
                validateResult = validateResp.data;
                validationResponse = validateResult;
                stepNumber++;
                await addStepToAgentMessage(userContext.chatId, messageId, {
                    step: stepNumber,
                    phase: 'evaluation',
                    type: 'result',
                    chunkData: validateResult,
                    timestamp: new Date()
                });
            } catch (err) {
                validateResult = null;
            }

            if (validateResult?.is_valid) {
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
                    res.write(`data: ${JSON.stringify({ phase: 'video', type: 'video-request', message: 'Submitting render...' })}\n\n`);
                    const renderResponse = await axios.post(`${MANIM_RENDERER_URL}/render`, renderPayload, { timeout: 10000 });
                    jobId = ((renderResponse.data as any)?.job_id) || '';
                    videoStarted = !!jobId;
                    if (videoStarted) {
                        res.write(`data: ${JSON.stringify({ phase: 'video', type: 'video-started', job_id: jobId })}\n\n`);
                        stepNumber++;
                        await addStepToAgentMessage(userContext.chatId, messageId, {
                            step: stepNumber,
                            phase: 'video',
                            type: 'video-processing',
                            chunkData: { job_id: jobId, message: 'Video started' },
                            timestamp: new Date()
                        });

                        // Also stream a video-processing chunk so frontend starts polling
                        res.write(`data: ${JSON.stringify({ phase: 'video', type: 'video-processing', job_id: jobId, message: 'Video is processing' })}\n\n`);
                        break; // success
                    }
                } catch (err) {
                    res.write(`data: ${JSON.stringify({ phase: 'video', type: 'error', message: 'Render submission failed', error: err instanceof Error ? err.message : String(err) })}\n\n`);
                }
            }

            // Prepare for next iteration: include validate output as system context
            iterate++;
            if (!validateResult?.is_valid) {
                const validatorFeedback = JSON.stringify(validateResult || { error: 'validate call failed' });
                validationFeedback = `\n\nVALIDATOR_FEEDBACK: ${validatorFeedback}`;
            }
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

        // Stop heartbeat before finishing
        stopHeartbeat();
        // ====== PHASE 6: COMPLETION ======
        const duration = Date.now() - startTime;
        const finalMessage = `✅ Content creation workflow completed!\n\nRefinement iterations: ${iterate}\nCode validation: ${validationResponse?.is_valid ? 'Passed' : 'Completed with warnings'}\nVideo generation: ${videoStarted ? 'Started (processing in background)' : 'Failed to start'}\nJob ID: ${jobId || 'N/A'}\nTotal time: ${(duration / 1000).toFixed(2)}s\n\n💡 The video is being generated. You can close this page and come back later to view it.`;

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
                errorCount: validationResponse?.is_valid ? 0 : 1,
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
        stepNumber++;
        if (messageId) {
            await addStepToAgentMessage(userContext.chatId, messageId, {
            step: stepNumber,
            phase: 'completion',
            type: 'error',
            chunkData: { error: error instanceof Error ? error.message : 'Unknown error' },
            timestamp: new Date()
            });
        }
        if (typeof stopHeartbeat === 'function') stopHeartbeat();
        res.end();
    }
}