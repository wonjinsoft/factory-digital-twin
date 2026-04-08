// 파일: web/src/stores/deviceStore.ts
// 역할: 디바이스(스마트폰 등) 상태 전역 스토어
import { create } from "zustand";

export interface Device {
  device_id: string;
  device_type: string;
  name: string;
  flash: string;        // "on" | "off"
  battery: string;      // "0"~"100"
  online: string;       // "true" | "false"
  last_updated: string;
}

interface DeviceStore {
  devices: Record<string, Device>;
  setDevices: (devices: Device[]) => void;
  updateDevice: (device: Device) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  devices: {},

  setDevices: (devices) =>
    set({
      devices: Object.fromEntries(devices.map((d) => [d.device_id, d])),
    }),

  updateDevice: (device) =>
    set((state) => ({
      devices: {
        ...state.devices,
        [device.device_id]: device,
      },
    })),
}));
