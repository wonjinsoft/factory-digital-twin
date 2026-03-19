// 파일: web/src/components/AlarmPanel.tsx
// 역할: 활성 알람 목록 표시 및 확인 처리
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

  // 3초마다 알람 목록 갱신
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

  const getBadgeColor = (level: string) => {
    if (level === "critical") return "bg-red-500";
    if (level === "warning") return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <div className="w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-3">
        🚨 알람 {alarms.length > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-1">
            {alarms.length}
          </span>
        )}
      </h2>

      {alarms.length === 0 ? (
        <p className="text-gray-400 text-sm">활성 알람 없음 ✅</p>
      ) : (
        <div className="space-y-2">
          {alarms.map((alarm) => (
            <div
              key={alarm.machine_id}
              className="border border-gray-200 rounded-lg p-3"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-800">{alarm.machine_id}</span>
                <span className={`${getBadgeColor(alarm.alarm_level)} text-white text-xs px-2 py-1 rounded-full`}>
                  {alarm.alarm_level === "critical" ? "심각" : "경고"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                에러: {alarm.error_code} | 온도: {alarm.temperature}°C
              </p>
              <button
                onClick={() => acknowledge(alarm.machine_id)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1 rounded"
              >
                ✓ 확인
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}