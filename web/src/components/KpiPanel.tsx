// 파일: web/src/components/KpiPanel.tsx
// 역할: 설비 핵심 KPI 요약 표시
import { useMachineStore } from "../stores/machineStore";

export function KpiPanel() {
  const machines = useMachineStore((state) => state.machines);
  const list = Object.values(machines);

  if (list.length === 0) return null;

  const total = list.length;
  const running = list.filter((m) => m.power === "on").length;
  const stopped = total - running;
  const criticalCount = list.filter((m) => m.alarm_level === "critical").length;
  const uptimeRate = total > 0 ? ((running / total) * 100).toFixed(1) : "0";

  const avgTemp = (
    list
      .filter((m) => m.power === "on")
      .reduce((sum, m) => sum + parseFloat(m.temperature || "0"), 0) /
    (running || 1)
  ).toFixed(1);

  const avgRpm = Math.round(
    list
      .filter((m) => m.power === "on")
      .reduce((sum, m) => sum + parseInt(m.rpm || "0", 10), 0) /
    (running || 1)
  );

  return (
    <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
        <KpiCard label="가동률" value={`${uptimeRate}%`} color={parseFloat(uptimeRate) >= 80 ? "text-green-600" : "text-red-600"} />
        <KpiCard label="가동 중" value={`${running}대`} color="text-green-600" />
        <KpiCard label="정지" value={`${stopped}대`} color="text-gray-500" />
        <KpiCard label="Critical" value={`${criticalCount}`} color={criticalCount > 0 ? "text-red-600" : "text-gray-400"} />
        <KpiCard label="평균 온도" value={`${avgTemp}°C`} color={parseFloat(avgTemp) > 75 ? "text-orange-500" : "text-gray-700"} />
        <KpiCard label="평균 RPM" value={`${avgRpm}`} color="text-gray-700" />
      </div>
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}
