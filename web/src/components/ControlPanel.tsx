// 파일: web/src/components/ControlPanel.tsx
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
      await axios.post(`${API_URL}/machines/${machine.machine_id}/control`, { action });
    } catch (err) {
      console.error("제어 명령 실패", err);
    } finally {
      setLoading(false);
    }
  };

  const buttons = [
    { label: "전원 ON",  action: "power_on",        color: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25", disabled: loading || machine.power === "on" },
    { label: "전원 OFF", action: "power_off",        color: "bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25",                 disabled: loading || machine.power === "off" },
    { label: "소재 적재", action: "material_load",   color: "bg-blue-500/15 border-blue-500/40 text-blue-400 hover:bg-blue-500/25",             disabled: loading || machine.material_loaded === "true" },
    { label: "소재 제거", action: "material_unload", color: "bg-orange-500/15 border-orange-500/40 text-orange-400 hover:bg-orange-500/25",     disabled: loading || machine.material_loaded === "false" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1c1c1e]/95 backdrop-blur-3xl border-t border-white/10 rounded-t-2xl px-6 pt-4 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
      {/* 핸들 */}
      <div className="w-9 h-1 bg-white/20 rounded-full mx-auto mb-4" />

      {/* 헤더 */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <p className="text-[12px] text-zinc-500 mb-0.5">제어 패널</p>
          <h2 className="text-[17px] font-semibold text-[#f5f5f7]">
            {machine.machine_id}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 text-[#ebebf5] text-sm flex items-center justify-center transition-colors"
        >
          ✕
        </button>
      </div>

      {/* 버튼 그리드 */}
      <div className="grid grid-cols-4 gap-3">
        {buttons.map(({ label, action, color, disabled }) => (
          <button
            key={action}
            onClick={() => sendCommand(action)}
            disabled={disabled}
            className={`border rounded-xl py-3 text-[13px] font-medium transition-all ${
              disabled
                ? "bg-white/5 border-white/6 text-zinc-700 cursor-not-allowed"
                : `${color} cursor-pointer`
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}