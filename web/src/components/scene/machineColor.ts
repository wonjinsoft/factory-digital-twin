// 파일: web/src/components/scene/machineColor.ts
export function getMachineColor(alarmLevel: string, power: string): string {
  if (alarmLevel === "critical") return "#ef4444";
  if (alarmLevel === "warning")  return "#f59e0b";
  if (power === "off")           return "#9ca3af";
  return "#22c55e";
}
