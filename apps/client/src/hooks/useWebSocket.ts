"use client";

import { useEffect, useRef, useCallback } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3000/ws";

type MessageHandler = (data: unknown) => void;

export function useWebSocket(channels: string[], onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const channelsRef = useRef(channels);
  channelsRef.current = channels;

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      for (const ch of channelsRef.current) {
        ws.send(JSON.stringify({ action: "subscribe", channel: ch }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessage(parsed);
      } catch {}
    };

    ws.onclose = () => {
      // Reconnect after 2s
      setTimeout(connect, 2000);
    };

    ws.onerror = () => ws.close();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);
}
