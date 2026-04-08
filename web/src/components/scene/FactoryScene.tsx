// 파일: web/src/components/scene/FactoryScene.tsx
// 역할: 3D 팩토리 씬 — 조립만 담당, 개별 컴포넌트는 별도 파일
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMachineStore } from "../../stores/machineStore";
import axios from "axios";
import { API_URL } from "../../config";
import * as THREE from "three";

import { FloorSlab } from "./FloorSlab";
import { CameraController, CameraTarget } from "./CameraController";
import { DragController, DragState } from "./DragController";
import { ConveyorBox } from "./ConveyorBox";
import { SampleMachine, MachineBox } from "./MachineModels";
import { SmartphoneModel } from "./SmartphoneModel";
import { useDeviceStore } from "../../stores/deviceStore";

export function FactoryScene() {
  const machines = useMachineStore((state) => state.machines);
  const { devices, setDevices } = useDeviceStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget>(null);
  const orbitRef = useRef<any>(null);

  // "overview" 애니메이션 완료 후 OrbitControls 재활성화 + orbit target 초기화
  useEffect(() => {
    if (cameraTarget !== "overview") return;
    const t = setTimeout(() => {
      if (orbitRef.current) {
        orbitRef.current.target.set(0, 0, 0);
        orbitRef.current.update();
      }
      setCameraTarget(null);
    }, 1200);
    return () => clearTimeout(t);
  }, [cameraTarget]);

  const [editMode, setEditMode] = useState(false);
  const [positions, setPositions] = useState<Record<string, [number, number, number]>>({});
  const machineList = Object.values(machines);
  const dragState = useRef<DragState>({ draggingId: null, groupRef: null });

  const defaultPosition = useCallback((index: number): [number, number, number] => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    return [col * 4 - 8, 0.01, row * 4 - 6];
  }, []);

  // 초기 디바이스 목록 로드
  useEffect(() => {
    axios.get(`${API_URL}/devices`)
      .then((res) => setDevices(res.data.devices))
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/layout`)
      .then((res) => {
        const layout = res.data.layout;
        const loaded: Record<string, [number, number, number]> = {};
        Object.entries(layout).forEach(([id, pos]: any) => {
          loaded[id] = [pos.x, 0.01, pos.z];
        });
        setPositions(loaded);
      })
      .catch(() => {});
  }, []);

  const getPosition = (machine_id: string, index: number): [number, number, number] => {
    return positions[machine_id] ?? defaultPosition(index);
  };

  const machinePositions = useMemo(() => {
    const map: Record<string, [number, number, number]> = {};
    machineList.forEach((m, i) => {
      map[m.machine_id] = getPosition(m.machine_id, i);
    });
    return map;
  }, [positions, machineList.length]);

  const handleDragEnd = useCallback((id: string, x: number, z: number) => {
    setPositions((prev) => {
      const next = { ...prev, [id]: [x, 0.01, z] as [number, number, number] };
      const payload: Record<string, { x: number; z: number }> = {};
      Object.entries(next).forEach(([mid, pos]) => {
        payload[mid] = { x: pos[0], z: pos[2] };
      });
      axios.post(`${API_URL}/layout`, payload).catch(console.error);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((id: string, groupRef: React.RefObject<THREE.Group>) => {
    dragState.current = { draggingId: id, groupRef };
  }, []);

  const handleClick = (machine_id: string, position: [number, number, number]) => {
    if (editMode) return;
    if (selectedId === machine_id) {
      if (orbitRef.current) {
        orbitRef.current.target.set(position[0], position[1], position[2]);
        orbitRef.current.update();
      }
      setSelectedId(null);
      setCameraTarget(null);
    } else {
      setSelectedId(machine_id);
      setCameraTarget(new THREE.Vector3(...position));
    }
  };

  const resetLayout = async () => {
    await axios.post(`${API_URL}/layout`, {}).catch(console.error);
    setPositions({});
  };

  const toggleEditMode = () => {
    setEditMode((v) => !v);
    setSelectedId(null);
    setCameraTarget(null);
  };

  const handleOverview = () => {
    setSelectedId(null);
    setCameraTarget("overview");
  };

  return (
    <div className="w-full h-full relative">
      {!editMode && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={handleOverview}
            className="px-3 py-2 rounded-xl text-sm font-semibold bg-zinc-800 border border-zinc-600 text-zinc-200 hover:bg-zinc-700 transition-all"
          >
            ⌂ 전체보기
          </button>
        </div>
      )}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {editMode && (
          <button
            onClick={resetLayout}
            className="px-4 py-2 rounded-xl text-sm font-semibold border bg-zinc-800 border-red-600 text-red-400 hover:bg-red-900 transition-all"
          >
            ↺ 초기화
          </button>
        )}
        <button
          onClick={toggleEditMode}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            editMode
              ? "bg-yellow-400 border-yellow-300 text-black"
              : "bg-zinc-800 border-zinc-600 text-zinc-200 hover:bg-zinc-700"
          }`}
        >
          {editMode ? "✓ 편집 완료" : "✏️ 배치 편집"}
        </button>
      </div>

      {editMode && (
        <div className="absolute top-14 left-0 right-0 flex justify-center px-4 z-10">
          <div className="bg-yellow-400/90 text-black text-xs font-semibold px-4 py-2 rounded-full text-center max-w-xs w-full sm:w-auto">
            기계를 드래그해서 위치를 조정하세요 — 자동 저장됩니다
          </div>
        </div>
      )}

      <Canvas camera={{ position: [0, 15, 20], fov: 50 }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-camera-near={0.1}
          shadow-camera-far={100}
        />
        <CameraController target={cameraTarget} />
        <DragController dragState={dragState} onDragEnd={handleDragEnd} />
        <FloorSlab />
        <ConveyorBox machinePositions={machinePositions} />

        {machineList.map((machine, index) => {
          const position = getPosition(machine.machine_id, index);
          const props = {
            key: machine.machine_id,
            machine,
            position,
            isSelected: selectedId === machine.machine_id,
            editMode,
            onClick: () => handleClick(machine.machine_id, position),
            onDragStart: (ref: React.RefObject<THREE.Group>) =>
              handleDragStart(machine.machine_id, ref),
            onOverview: handleOverview,
          };
          if (index === 0) return <SampleMachine {...props} />;
          return <MachineBox {...props} />;
        })}

        {/* 디바이스 오브젝트 (스마트폰 등) */}
        {Object.values(devices).map((device, i) => {
          const pos: [number, number, number] = [-12, 1, -6 + i * 3];
          return (
            <SmartphoneModel
              key={device.device_id}
              device={device}
              position={pos}
              onSelect={() => {
                setSelectedId(null);
                setCameraTarget(new THREE.Vector3(...pos));
              }}
            />
          );
        })}

        <OrbitControls ref={orbitRef} makeDefault enabled={!editMode && (cameraTarget === null)} />
      </Canvas>
    </div>
  );
}
