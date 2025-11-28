/**
/**
 * Code Evaluator Agent
 * 
 * Evaluates Manim Python code for syntax errors, logical issues, and best practices.
 * Used in content creation flow to ensure code correctness before video generation.
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import dotenv from 'dotenv';
import { models, get_model } from '../llm_models';

dotenv.config();

/**
 * Code Evaluation Result Schema
 */
const CodeEvaluationSchema = z.object({
    isValid: z.boolean().describe('Whether the code is valid and ready to render'),
    errors: z.array(z.string()).describe('List of critical errors that must be fixed'),
    warnings: z.array(z.string()).describe('List of warnings or potential issues'),
    suggestions: z.array(z.string()).describe('List of improvement suggestions'),
    sceneName: z.string().optional().describe('Detected Scene class name if found')
});

export type CodeEvaluationResult = z.infer<typeof CodeEvaluationSchema>;

/**
 * System prompt for code evaluation
 */
const CODE_EVALUATOR_PROMPT = `You are an expert Manim code reviewer. Your task is to evaluate Manim Python code for correctness and best practices.

EVALUATION CRITERIA:
1. **Syntax Errors**: Check for Python syntax errors
2. **Import Issues**: Verify "from manim import *" is present
3. **Scene Class**: Ensure there's a valid Scene class that inherits from Scene
4. **construct() Method**: Verify the construct() method exists and is properly implemented
5. **Common Manim Errors**:
   - Missing self parameter in methods
   - Incorrect animation syntax
   - Invalid Manim objects or methods
   - Missing wait() calls
   - Improper object positioning

VALIDATION RULES:
- If there are NO critical errors and the code follows best practices, set isValid to true
- If there are syntax errors, missing imports, or invalid Manim code, set isValid to false
- Scene name should be extracted from the class definition (e.g., "class MyScene(Scene):" → "MyScene")

Provide structured evaluation with errors, warnings, and suggestions.`;

/**
 * Evaluates Manim Python code for correctness
 */
export async function evaluateManimCode(code: string): Promise<CodeEvaluationResult> {
    try {
        const result = await generateObject({
            model: get_model(models.code_evaluator.provider, models.code_evaluator.model),
            system: CODE_EVALUATOR_PROMPT,
            prompt: `Evaluate this Manim code:\n\`\`\`python\n${code}\n\`\`\``,
            schema: CodeEvaluationSchema,
            temperature: 0.3,
        });

        return result.object;
    } catch (error) {
        console.error('Error evaluating Manim code:', error);

        // Return a safe fallback evaluation
        return {
            isValid: false,
            errors: ['Failed to evaluate code: ' + (error instanceof Error ? error.message : 'Unknown error')],
            warnings: [],
            suggestions: ['Please review the code manually'],
            sceneName: undefined
        };
    }
}
