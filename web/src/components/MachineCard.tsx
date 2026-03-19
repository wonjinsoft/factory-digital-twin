// 파일: web/src/components/MachineCard.tsx
// 역할: 기계 1대 상태 카드
import { Machine } from "../stores/machineStore";

interface Props {
  machine: Machine;
}

// 상태별 색상
function getStatusColor(machine: Machine): string {
  if (machine.alarm_level === "critical") return "bg-red-500";
  if (machine.alarm_level === "warning") return "bg-yellow-500";
  if (machine.power === "off") return "bg-gray-400";
  return "bg-green-500";
}

function getStatusText(machine: Machine): string {
  if (machine.alarm_level === "critical") return "심각";
  if (machine.alarm_level === "warning") return "경고";
  if (machine.power === "off") return "정지";
  return "가동중";
}

export function MachineCard({ machine }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-gray-800">{machine.machine_id}</h3>
        <span className={`${getStatusColor(machine)} text-white text-xs px-2 py-1 rounded-full`}>
          {getStatusText(machine)}
        </span>
      </div>

      {/* 상태 정보 */}
      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>🌡️ 온도</span>
          <span className="font-medium">{machine.temperature}°C</span>
        </div>
        <div className="flex justify-between">
          <span>⚙️ RPM</span>
          <span className="font-medium">{machine.rpm}</span>
        </div>
        <div className="flex justify-between">
          <span>📦 재료</span>
          <span className="font-medium">
            {machine.material_loaded === "true" ? "✅ 있음" : "❌ 없음"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>🔧 에러</span>
          <span className="font-medium">{machine.error_code}</span>
        </div>
      </div>
    </div>
  );
}