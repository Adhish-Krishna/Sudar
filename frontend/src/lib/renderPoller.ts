import { sudarAgent } from '../api';

export interface PollOptions {
    intervalMs?: number;
    maxAttempts?: number;
}

export async function pollRenderStatus(jobId: string, options?: PollOptions) {
    const intervalMs = options?.intervalMs ?? 2000;
    const maxAttempts = options?.maxAttempts ?? 30; // ~60s
    let attempt = 0;
    while (attempt < maxAttempts) {
        try {
            const statusResp = await sudarAgent.getRenderStatus(jobId);
            if (statusResp?.status === 'completed' || statusResp?.status === 'error') {
                return statusResp;
            }
        } catch (err) {
            // Non-fatal; try again until max attempts
            console.warn('Error while polling render status:', err);
        }
        attempt++;
        await new Promise((r) => setTimeout(r, intervalMs));
    }
    return undefined;
}