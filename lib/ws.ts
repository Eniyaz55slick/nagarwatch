import { WS_URL } from "./api";

type MessageHandler = (data: Record<string, unknown>) => void;

export function createWebSocket(path: string, onMessage: MessageHandler): WebSocket {
  const ws = new WebSocket(`${WS_URL}/ws/${path}`);

  ws.onopen = () => {
    // Keepalive ping every 30s
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      else clearInterval(interval);
    }, 30000);
  };

  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.type !== "pong") onMessage(data);
    } catch {}
  };

  ws.onclose = () => {
    // Reconnect after 3s
    setTimeout(() => createWebSocket(path, onMessage), 3000);
  };

  return ws;
}
