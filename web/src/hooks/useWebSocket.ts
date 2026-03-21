// 파일: web/src/hooks/useWebSocket.ts
// 역할: WebSocket 연결 관리 훅
import { useEffect, useRef } from "react";
import { WS_URL } from "../config";
import { useMachineStore } from "../stores/machineStore";

export function useWebSocket(onAgentStatus?: (paused: boolean) => void) {
  const ws = useRef<WebSocket | null>(null);
  const updateMachine = useMachineStore((state) => state.updateMachine);
  const onAgentStatusRef = useRef(onAgentStatus);
  onAgentStatusRef.current = onAgentStatus;

  useEffect(() => {
    function connect() {
      ws.current = new WebSocket(`${WS_URL}/ws/state`);

      ws.current.onopen = () => {
        console.info("WebSocket 연결됨");
      };

      ws.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "state_update") {
          updateMachine(msg.data);
        } else if (msg.type === "agent_status") {
          onAgentStatusRef.current?.(msg.data.paused);
        }
      };

      ws.current.onclose = () => {
        console.info("WebSocket 끊김 — 3초 후 재연결");
        setTimeout(connect, 3000);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket 오류", error);
      };
    }

    connect();

    return () => {
      ws.current?.close();
    };
  }, []);
}