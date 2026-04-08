// 파일: web/src/components/scene/DevicePopup.tsx
// 역할: 스마트폰 오브젝트 클릭 시 팝업 — flash on/off 제어, 배터리 표시
import { Html } from "@react-three/drei";
import { useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { Device } from "../../stores/deviceStore";

interface Props {
  device: Device;
  onClose: () => void;
}

export function DevicePopup({ device, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  const sendCommand = async (action: string) => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/devices/${device.device_id}/control`, { action });
    } catch (err) {
      console.error("디바이스 제어 실패", err);
    } finally {
      setLoading(false);
    }
  };

  const battery = parseInt(device.battery ?? "0", 10);
  const isOn = device.flash === "on";
  const isConnected = device.online === "true";

  const batteryColor =
    battery > 50 ? "text-green-500" : battery > 20 ? "text-yellow-500" : "text-red-500";

  return (
    <Html position={[0, 0.7, 0]} center distanceFactor={8}>
      <div
        className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-44"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-sm text-gray-800">
            📱 {device.device_id}
          </span>
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
            <span>연결</span>
            <span className={isConnected ? "text-green-500 font-bold" : "text-gray-400"}>
              {isConnected ? "연결됨" : "오프라인"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>플래시</span>
            <span className={isOn ? "text-yellow-500 font-bold" : "text-gray-400"}>
              {isOn ? "켜짐 💡" : "꺼짐"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>배터리</span>
            <span className={batteryColor + " font-bold"}>
              {battery}%
            </span>
          </div>
        </div>

        {/* 제어 버튼 */}
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => sendCommand("flash_on")}
            disabled={loading || isOn || !isConnected}
            className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-black text-xs py-1 rounded cursor-pointer font-semibold"
          >
            💡 켜기
          </button>
          <button
            onClick={() => sendCommand("flash_off")}
            disabled={loading || !isOn || !isConnected}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white text-xs py-1 rounded cursor-pointer"
          >
            ■ 끄기
          </button>
        </div>
      </div>
    </Html>
  );
}
