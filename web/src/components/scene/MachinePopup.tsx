// 파일: web/src/components/scene/MachinePopup.tsx
// 역할: 3D 씬에서 기계 클릭 시 나타나는 팝업 (Tailwind 버전)
import { Html } from "@react-three/drei";
import { useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";

interface Props {
  machine: any;
  onClose: () => void;
}

export function MachinePopup({ machine, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  const sendCommand = async (action: string) => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/machines/${machine.machine_id}/control`, { action });
    } catch (err) {
      console.error("제어 명령 실패", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Html position={[0, 2.5, 0]} center distanceFactor={8}>
      <div
        className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-48"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-sm text-gray-800">{machine.machine_id}</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg border-none bg-transparent cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 상태 정보 */}
        <div className="text-xs text-gray-600 space-y-1 mb-3">
          <div className="flex justify-between">
            <span>전원</span>
            <span className={machine.power === "on" ? "text-green-500 font-bold" : "text-gray-400"}>
              {machine.power === "on" ? "켜짐" : "꺼짐"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>온도</span>
            <span>{machine.temperature}°C</span>
          </div>
          <div className="flex justify-between">
            <span>RPM</span>
            <span>{machine.rpm}</span>
          </div>
          <div className="flex justify-between">
            <span>재료</span>
            <span>{machine.material_loaded === "true" ? "✅" : "❌"}</span>
          </div>
          {machine.alarm_level !== "none" && (
            <div className="flex justify-between">
              <span>알람</span>
              <span className="text-red-500 font-bold">{machine.alarm_level}</span>
            </div>
          )}
        </div>

        {/* 제어 버튼 */}
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => sendCommand("power_on")}
            disabled={loading || machine.power === "on"}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white text-xs py-1 rounded cursor-pointer"
          >
            ▶ 켜기
          </button>
          <button
            onClick={() => sendCommand("power_off")}
            disabled={loading || machine.power === "off"}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white text-xs py-1 rounded cursor-pointer"
          >
            ■ 끄기
          </button>
          <button
            onClick={() => sendCommand("material_load")}
            disabled={loading || machine.material_loaded === "true"}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-xs py-1 rounded cursor-pointer"
          >
            📦 투입
          </button>
          <button
            onClick={() => sendCommand("material_unload")}
            disabled={loading || machine.material_loaded === "false"}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-xs py-1 rounded cursor-pointer"
          >
            📭 제거
          </button>
        </div>
      </div>
    </Html>
  );
}