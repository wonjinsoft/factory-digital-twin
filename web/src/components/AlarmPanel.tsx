// 파일: web/src/components/AlarmPanel.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

interface Alarm {
  machine_id: string;
  alarm_level: string;
  error_code: string;
  temperature: string;
  last_updated: string;
}

export function AlarmPanel() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  useEffect(() => {
    const fetchAlarms = async () => {
      try {
        const res = await axios.get(`${API_URL}/alarms`);
        setAlarms(res.data.alarms);
      } catch (err) {
        console.error("알람 조회 실패", err);
      }
    };
    fetchAlarms();
    const interval = setInterval(fetchAlarms, 3000);
    return () => clearInterval(interval);
  }, []);

  const acknowledge = async (machine_id: string) => {
    try {
      await axios.post(`${API_URL}/alarms/${machine_id}/acknowledge`);
    } catch (err) {
      console.error("알람 확인 실패", err);
    }
  };

  return (
    <div className="w-full shrink-0 max-h-48 md:max-h-none md:w-72 bg-white/[0.02] border-t md:border-t-0 md:border-l border-white/7 p-4 md:p-5 overflow-y-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[15px] font-semibold text-[#f5f5f7]">알람</span>
        {alarms.length > 0 && (
          <span className="bg-red-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
            {alarms.length}
          </span>
        )}
      </div>

      {alarms.length === 0 ? (
        <div className="flex flex-col items-center mt-16 gap-2 text-zinc-600">
          <span className="text-3xl">✓</span>
          <span className="text-[13px]">활성 알람 없음</span>
        </div>
      ) : (
        <div className="space-y-2">
          {alarms.map((alarm) => {
            const isCritical = alarm.alarm_level === "critical";
            return (
              <div
                key={alarm.machine_id}
                className={`rounded-xl p-3 border ${
                  isCritical
                    ? "bg-red-500/10 border-red-500/25"
                    : "bg-yellow-400/10 border-yellow-400/25"
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[13px] font-semibold text-[#f5f5f7]">
                    {alarm.machine_id}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isCritical
                        ? "bg-red-500 text-white"
                        : "bg-yellow-400 text-black"
                    }`}
                  >
                    {isCritical ? "위험" : "경고"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mb-2.5">
                  {alarm.error_code} · {alarm.temperature}°C
                </p>
                <button
                  onClick={() => acknowledge(alarm.machine_id)}
                  className="w-full bg-white/7 hover:bg-white/12 border border-white/10 text-[#ebebf5] text-[12px] font-medium py-1.5 rounded-lg transition-colors"
                >
                  확인
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}