import { z } from 'zod';

export const CodeOutputSchema = z.object({
    code: z.string(),
    sceneName: z.string().optional()
});

export type CodeOutput = z.infer<typeof CodeOutputSchema>;
