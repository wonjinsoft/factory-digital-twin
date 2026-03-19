// 파일: web/src/components/ControlPanel.tsx
// 역할: 기계 선택 시 나타나는 제어 패널
import { useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { Machine } from "../stores/machineStore";

interface Props {
  machine: Machine;
  onClose: () => void;
}

export function ControlPanel({ machine, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  const sendCommand = async (action: string) => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/machines/${machine.machine_id}/control`, {
        action,
      });
    } catch (err) {
      console.error("제어 명령 실패", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-800">
          ⚙️ {machine.machine_id} 제어
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-3">
        {/* 전원 제어 */}
        <button
          onClick={() => sendCommand("power_on")}
          disabled={loading || machine.power === "on"}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium"
        >
          ▶ 켜기
        </button>
        <button
          onClick={() => sendCommand("power_off")}
          disabled={loading || machine.power === "off"}
          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium"
        >
          ■ 끄기
        </button>

        {/* 재료 제어 */}
        <button
          onClick={() => sendCommand("material_load")}
          disabled={loading || machine.material_loaded === "true"}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium"
        >
          📦 재료 투입
        </button>
        <button
          onClick={() => sendCommand("material_unload")}
          disabled={loading || machine.material_loaded === "false"}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium"
        >
          📭 재료 제거
        </button>
      </div>
    </div>
  );
}