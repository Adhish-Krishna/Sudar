import type { Response } from 'express';

export function startHeartbeat(res: Response, intervalMs = 10000) {
    // Send a minimal heartbeat as an SSE message to keep connection alive
    const interval = setInterval(() => {
        try {
            res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
        } catch (err) {
            // ignore errors while writing heartbeats
        }
    }, intervalMs);

    return () => clearInterval(interval);
}
