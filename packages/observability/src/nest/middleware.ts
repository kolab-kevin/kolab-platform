import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

import { REQUEST_ID_HEADER } from '../request-id';

export type RequestWithId = IncomingMessage & { id?: string };

export function requestIdMiddleware() {
  return (req: RequestWithId, res: ServerResponse, next: () => void) => {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const requestId = (Array.isArray(incoming) ? incoming[0] : incoming) ?? randomUUID();

    req.id = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  };
}

export function getProcessMetrics() {
  const memory = process.memoryUsage();
  return {
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rss: memory.rss,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external,
    },
    nodeVersion: process.version,
    pid: process.pid,
  };
}
