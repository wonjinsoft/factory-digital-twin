// 파일: web/src/components/EventTimeline.tsx
// 역할: 설비 이벤트 이력 타임라인 표시
import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

interface Event {
  machine_id: string;
  event_type: string;
  detail: string;
  timestamp: string;
}

const EVENT_ICONS: Record<string, string> = {
  alarm: "🚨",
  control: "🎛️",
};

const EVENT_COLORS: Record<string, string> = {
  alarm: "border-red-300",
  control: "border-blue-300",
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

export function EventTimeline() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetch = () => {
      axios.get(`${API_URL}/events?limit=20`)
        .then((res) => setEvents(res.data.events))
        .catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 3000);
    return () => clearInterval(interval);
  }, []);

  if (events.length === 0) {
    return (
      <div className="text-gray-400 text-sm text-center py-4">
        이벤트 이력 없음
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {events.map((ev, i) => (
        <div
          key={`${ev.timestamp}-${i}`}
          className={`flex items-start gap-2 px-3 py-2 rounded-lg bg-white border-l-4 ${EVENT_COLORS[ev.event_type] || "border-gray-300"}`}
        >
          <span className="text-sm">{EVENT_ICONS[ev.event_type] || "📋"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700">{ev.machine_id}</span>
              <span className="text-xs text-gray-400">{formatTime(ev.timestamp)}</span>
            </div>
            <p className="text-xs text-gray-600 truncate">{ev.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
