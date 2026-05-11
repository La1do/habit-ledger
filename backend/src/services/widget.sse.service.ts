import type { Response } from "express";

// ─── In-memory SSE connection registry ───────────────────────────────────────
// userId → Set of active SSE Response objects

const connections = new Map<string, Set<Response>>();

export function addConnection(userId: string, res: Response): void {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(res);
  console.info(`[widget:sse] Client connected for user ${userId} (total: ${connections.get(userId)!.size})`);
}

export function removeConnection(userId: string, res: Response): void {
  const clients = connections.get(userId);
  if (clients) {
    clients.delete(res);
    if (clients.size === 0) {
      connections.delete(userId);
    }
  }
  console.info(`[widget:sse] Client disconnected for user ${userId}`);
}

/**
 * Push "update" event to all SSE clients of a user.
 * Called after webhook processes a task completion.
 */
export function notifyUser(userId: string): void {
  const clients = connections.get(userId);
  if (!clients || clients.size === 0) return;

  const event = `event: update\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`;

  for (const res of clients) {
    try {
      res.write(event);
    } catch {
      // Client disconnected — will be cleaned up on close event
    }
  }

  console.info(`[widget:sse] Notified ${clients.size} client(s) for user ${userId}`);
}
