// 파일: web/src/stores/machineStore.ts
// 역할: 기계 상태 전역 스토어
import { create } from "zustand";

// 기계 상태 타입 정의
export interface Machine {
  machine_id: string;
  power: string;
  temperature: string;
  rpm: string;
  material_loaded: string;
  alarm_level: string;
  error_code: string;
  last_updated: string;
}

interface MachineStore {
  machines: Record<string, Machine>;  // { M001: {...}, M002: {...} }
  setMachines: (machines: Machine[]) => void;
  updateMachine: (machine: Machine) => void;
}

export const useMachineStore = create<MachineStore>((set) => ({
  machines: {},

  // 전체 기계 목록 설정
  setMachines: (machines) =>
    set({
      machines: Object.fromEntries(
        machines.map((m) => [m.machine_id, m])
      ),
    }),

  // 기계 1대 업데이트
  updateMachine: (machine) =>
    set((state) => ({
      machines: {
        ...state.machines,
        [machine.machine_id]: machine,
      },
    })),
}));