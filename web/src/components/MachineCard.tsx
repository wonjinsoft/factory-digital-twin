import { Machine } from "../stores/machineStore";

interface Props {
  machine: Machine;
}

function getStatus(machine: Machine) {
  if (machine.alarm_level === "critical")
    return { dot: "bg-red-500", label: "위험", text: "text-red-400" };
  if (machine.alarm_level === "warning")
    return { dot: "bg-yellow-400", label: "경고", text: "text-yellow-400" };
  if (machine.power === "off")
    return { dot: "bg-zinc-500", label: "정지", text: "text-zinc-400" };
  return { dot: "bg-emerald-500", label: "정상", text: "text-emerald-400" };
}

export function MachineCard({ machine }: Props) {
  const status = getStatus(machine);

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 hover:bg-zinc-750 hover:border-zinc-600 transition-all duration-200">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-white">
          {machine.machine_id}
        </span>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${status.dot}`} />
          <span className={`text-xs font-medium ${status.text}`}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="border-t border-zinc-700 mb-3" />

      <div className="space-y-2">
        {[
          { label: "온도", value: `${machine.temperature}°C` },
          { label: "RPM",  value: machine.rpm },
          { label: "소재", value: machine.material_loaded === "true" ? "적재됨" : "없음" },
          { label: "코드", value: machine.error_code },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-xs text-zinc-500">{label}</span>
            <span className="text-xs font-medium text-zinc-100">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}