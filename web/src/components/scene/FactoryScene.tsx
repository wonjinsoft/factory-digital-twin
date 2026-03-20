// 파일: web/src/components/scene/FactoryScene.tsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html, useGLTF } from "@react-three/drei";
import { useSpring } from "@react-spring/three";
import { useMachineStore } from "../../stores/machineStore";
import { MachinePopup } from "./MachinePopup";
import axios from "axios";
import { API_URL } from "../../config";
import * as THREE from "three";

function getMachineColor(alarmLevel: string, power: string): string {
  if (alarmLevel === "critical") return "#ef4444";
  if (alarmLevel === "warning")  return "#f59e0b";
  if (power === "off")           return "#9ca3af";
  return "#22c55e";
}

function FloorSlab() {
  return (
    <group position={[0, -0.75, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[42, 0.4, 32]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.95} metalness={0.05} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(42, 0.4, 32)]} />
        <lineBasicMaterial color="#e5e7eb" />
      </lineSegments>
      <mesh position={[0, 0.22, 16]}>
        <boxGeometry args={[42, 0.04, 0.1]} />
        <meshStandardMaterial color="#d1d5db" emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 0.22, -16]}>
        <boxGeometry args={[42, 0.04, 0.1]} />
        <meshStandardMaterial color="#d1d5db" emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[-21, 0.22, 0]}>
        <boxGeometry args={[0.1, 0.04, 32]} />
        <meshStandardMaterial color="#d1d5db" emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[21, 0.22, 0]}>
        <boxGeometry args={[0.1, 0.04, 32]} />
        <meshStandardMaterial color="#d1d5db" emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

function CameraController({ target }: { target: THREE.Vector3 | null }) {
  const { camera } = useThree();
  useSpring({
    to: target
      ? { x: target.x, y: target.y + 6, z: target.z + 8 }
      : { x: 0, y: 15, z: 20 },
    onChange: ({ value }: any) => {
      camera.position.set(value.x, value.y, value.z);
      if (target) camera.lookAt(target);
    },
    config: { mass: 1, tension: 80, friction: 20 },
  });
  return null;
}

function SampleMachine({
  machine, position, isSelected, editMode, onClick, onDragEnd,
}: {
  machine: any;
  position: [number, number, number];
  isSelected: boolean;
  editMode: boolean;
  onClick: () => void;
  onDragEnd: (x: number, z: number) => void;
}) {
  const { scene } = useGLTF("/Glb Test/Glb Test.gltf");
  const cloned = useMemo(() => scene.clone(), [scene]);
  const color = getMachineColor(machine.alarm_level, machine.power);
  const dragging = useRef(false);
  const [dragPos, setDragPos] = useState<[number, number, number]>(position);

  useEffect(() => {
    if (!editMode) setDragPos(position);
  }, [position, editMode]);

  useEffect(() => {
    const targetColor = new THREE.Color(color);
    cloned.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((mat: any) => {
          mat.color.lerp(targetColor, 0.6);
          mat.emissive = new THREE.Color(
            machine.alarm_level === "critical" ? "#ef4444" :
            machine.alarm_level === "warning"  ? "#f59e0b" : "#000000"
          );
          mat.emissiveIntensity =
            machine.alarm_level === "critical" ? 0.4 :
            machine.alarm_level === "warning"  ? 0.25 : 0;
          mat.needsUpdate = true;
        });
      }
    });
  }, [cloned, color, machine.alarm_level]);

  return (
    <group
      position={dragPos}
      onPointerDown={(e) => {
        if (!editMode) return;
        e.stopPropagation();
        dragging.current = true;
      }}
      onPointerUp={(e) => {
        if (!editMode || !dragging.current) return;
        e.stopPropagation();
        dragging.current = false;
        onDragEnd(dragPos[0], dragPos[2]);
      }}
      onPointerMove={(e) => {
        if (!editMode || !dragging.current) return;
        e.stopPropagation();
        setDragPos([e.point.x, 0, e.point.z]);
      }}
    >
      <primitive
        object={cloned}
        scale={10}
        position={[0, -1, 0]}
        onClick={(e: any) => {
          if (editMode) return;
          e.stopPropagation();
          onClick();
        }}
      />
      <Html position={[0, -1.3, 0]} center distanceFactor={8}>
        <div style={{
          color: editMode ? "#facc15" : "white",
          fontSize: "15px",
          fontWeight: "bold",
          textShadow: "0 0 4px black",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          {machine.machine_id}
        </div>
      </Html>
      {isSelected && !editMode && (
        <MachinePopup machine={machine} onClose={onClick} />
      )}
    </group>
  );
}

function MachineBox({
  machine, position, isSelected, editMode, onClick, onDragEnd,
}: {
  machine: any;
  position: [number, number, number];
  isSelected: boolean;
  editMode: boolean;
  onClick: () => void;
  onDragEnd: (x: number, z: number) => void;
}) {
  const color = getMachineColor(machine.alarm_level, machine.power);
  const dragging = useRef(false);
  const [dragPos, setDragPos] = useState<[number, number, number]>(position);

  useEffect(() => {
    if (!editMode) setDragPos(position);
  }, [position, editMode]);

  return (
    <group
      position={dragPos}
      onPointerDown={(e) => {
        if (!editMode) return;
        e.stopPropagation();
        dragging.current = true;
      }}
      onPointerUp={(e) => {
        if (!editMode || !dragging.current) return;
        e.stopPropagation();
        dragging.current = false;
        onDragEnd(dragPos[0], dragPos[2]);
      }}
      onPointerMove={(e) => {
        if (!editMode || !dragging.current) return;
        e.stopPropagation();
        setDragPos([e.point.x, 0, e.point.z]);
      }}
    >
      <mesh
        castShadow
        onClick={(e) => {
          if (editMode) return;
          e.stopPropagation();
          onClick();
        }}
      >
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? color : "#000000"}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      <Html position={[0, -1.3, 0]} center distanceFactor={8}>
        <div style={{
          color: editMode ? "#facc15" : "white",
          fontSize: "15px",
          fontWeight: "bold",
          textShadow: "0 0 4px black",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          {machine.machine_id}
        </div>
      </Html>
      {isSelected && !editMode && (
        <MachinePopup machine={machine} onClose={onClick} />
      )}
    </group>
  );
}

export function FactoryScene() {
  const machines = useMachineStore((state) => state.machines);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [positions, setPositions] = useState<Record<string, [number, number, number]>>({});
  const machineList = Object.values(machines);

  const defaultPosition = useCallback((index: number): [number, number, number] => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    return [col * 4 - 8, 0, row * 4 - 6];
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/layout`)
      .then((res) => {
        const layout = res.data.layout;
        const loaded: Record<string, [number, number, number]> = {};
        Object.entries(layout).forEach(([id, pos]: any) => {
          loaded[id] = [pos.x, 0, pos.z];
        });
        setPositions(loaded);
      })
      .catch(() => {});
  }, []);

  const getPosition = (machine_id: string, index: number): [number, number, number] => {
    return positions[machine_id] ?? defaultPosition(index);
  };

  const handleDragEnd = useCallback((machine_id: string, x: number, z: number) => {
    const newPositions = { ...positions, [machine_id]: [x, 0, z] as [number, number, number] };
    setPositions(newPositions);
    const payload: Record<string, { x: number; z: number }> = {};
    Object.entries(newPositions).forEach(([id, pos]) => {
      payload[id] = { x: pos[0], z: pos[2] };
    });
    axios.post(`${API_URL}/layout`, payload).catch(console.error);
  }, [positions]);

  const handleClick = (machine_id: string, position: [number, number, number]) => {
    if (editMode) return;
    if (selectedId === machine_id) {
      setSelectedId(null);
      setCameraTarget(null);
    } else {
      setSelectedId(machine_id);
      setCameraTarget(new THREE.Vector3(...position));
    }
  };

  const toggleEditMode = () => {
    setEditMode((v) => !v);
    setSelectedId(null);
    setCameraTarget(null);
  };

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 right-4 z-10">
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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-yellow-400/90 text-black text-xs font-semibold px-4 py-2 rounded-full">
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
        />
        <CameraController target={cameraTarget} />
        <FloorSlab />

        {machineList.map((machine, index) => {
          const position = getPosition(machine.machine_id, index);
          const props = {
            key: machine.machine_id,
            machine,
            position,
            isSelected: selectedId === machine.machine_id,
            editMode,
            onClick: () => handleClick(machine.machine_id, position),
            onDragEnd: (x: number, z: number) => handleDragEnd(machine.machine_id, x, z),
          };
          if (index === 0) return <SampleMachine {...props} />;
          return <MachineBox {...props} />;
        })}

        <OrbitControls makeDefault enabled={!editMode && cameraTarget === null} />
      </Canvas>
    </div>
  );
}