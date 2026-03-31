// Tracks which raw Bun ServerWebSocket connections are subscribed to which channels. 
type RawWs = any;

class WsRegistry {
  private channels = new Map<string, Set<RawWs>>();

  subscribe(channel: string, ws: RawWs) {
    if (!this.channels.has(channel)) this.channels.set(channel, new Set());
    this.channels.get(channel)!.add(ws);
  }

  unsubscribe(channel: string, ws: RawWs) {
    this.channels.get(channel)?.delete(ws);
  }

  unsubscribeAll(ws: RawWs) {
    for (const subs of this.channels.values()) subs.delete(ws);
  }

  broadcast(channel: string, message: string) {
    const subs = this.channels.get(channel);
    if (!subs || subs.size === 0) return;
    for (const ws of subs) {
      try {
        ws.send(message);
      } catch {
        // ignore dead connections
      }
    }
  }
}

export const wsRegistry = new WsRegistry();
