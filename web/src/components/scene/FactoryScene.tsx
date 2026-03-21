// 파일: web/src/components/scene/FactoryScene.tsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
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

// ─── 바닥 ───────────────────────────────────────────────
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

// ─── 카메라 컨트롤러 ────────────────────────────────────
// target: Vector3 → 해당 기계로 이동 / "overview" → 전체보기로 복귀 / null → 현재 위치 유지
type CameraTarget = THREE.Vector3 | "overview" | null;

function CameraController({ target }: { target: CameraTarget }) {
  const { camera } = useThree();
  const targetRef = useRef(target);
  targetRef.current = target;

  const [{ x, y, z }, api] = useSpring(() => ({
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    config: { mass: 1, tension: 80, friction: 20 },
  }));

  // target이 바뀔 때 현재 카메라 위치에서 시작해 목적지로 애니메이션
  useEffect(() => {
    if (!target) return;
    const to = target === "overview"
      ? { x: 0, y: 15, z: 20 }
      : { x: (target as THREE.Vector3).x, y: (target as THREE.Vector3).y + 6, z: (target as THREE.Vector3).z + 8 };
    api.start({
      from: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      ...to,
    });
  }, [target]);

  // 매 프레임 스프링 값을 카메라에 반영 (target=null이면 OrbitControls에 맡김)
  useFrame(() => {
    if (!targetRef.current) return;
    camera.position.set(x.get(), y.get(), z.get());
    if (targetRef.current === "overview") camera.lookAt(0, 0, 0);
    else camera.lookAt(targetRef.current as THREE.Vector3);
  });

  return null;
}

// ─── 드래그 컨트롤러 ────────────────────────────────────
interface DragState {
  draggingId: string | null;
  groupRef: React.RefObject<THREE.Group> | null;
}

function DragController({
  dragState,
  onDragEnd,
}: {
  dragState: React.MutableRefObject<DragState>;
  onDragEnd: (id: string, x: number, z: number) => void;
}) {
  const { camera, gl } = useThree();
  const mouse = useRef(new THREE.Vector2());
  const raycaster = useRef(new THREE.Raycaster());
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersection = useRef(new THREE.Vector3());

  useEffect(() => {
    const el = gl.domElement;
    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouse.current.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
    };
    const onMouseUp = () => {
      if (dragState.current.draggingId && dragState.current.groupRef?.current) {
        const pos = dragState.current.groupRef.current.position;
        onDragEnd(dragState.current.draggingId, pos.x, pos.z);
      }
      dragState.current.draggingId = null;
      dragState.current.groupRef = null;
    };
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseup", onMouseUp);
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseup", onMouseUp);
    };
  }, [gl, dragState, onDragEnd]);

  useFrame(() => {
    if (!dragState.current.draggingId || !dragState.current.groupRef?.current) return;
    raycaster.current.setFromCamera(mouse.current, camera);
    raycaster.current.ray.intersectPlane(floorPlane.current, intersection.current);
    dragState.current.groupRef.current.position.set(
      intersection.current.x,
      0.01,
      intersection.current.z
    );
  });

  return null;
}

// ─── 컨베이어 박스 ──────────────────────────────────────
const START_POSITION = new THREE.Vector3(-14, 0.5, -10);
const LERP_SPEED = 0.05;
const ARRIVE_THRESHOLD = 0.15;

function ConveyorBox({
  machinePositions,
}: {
  machinePositions: Record<string, [number, number, number]>;
}) {
  const machines = useMachineStore((state) => state.machines);
  const meshRef = useRef<THREE.Mesh>(null);
  const currentPos = useRef(START_POSITION.clone());
  const waypointQueue = useRef<THREE.Vector3[]>([]);
  const prevLoaded = useRef<Record<string, string>>({});
  const isMoving = useRef(false);

  // material_loaded 변화 감지 → 웨이포인트 추가
  useEffect(() => {
    const machineList = Object.values(machines).sort((a, b) =>
      a.machine_id.localeCompare(b.machine_id)
    );

    let triggered = false;
    machineList.forEach((m) => {
      const prev = prevLoaded.current[m.machine_id];
      if (prev === "false" && m.material_loaded === "true") {
        triggered = true;
      }
      prevLoaded.current[m.machine_id] = m.material_loaded;
    });

    if (!triggered) return;

    // 이미 이동 중이면 큐에 추가하지 않음 (한 사이클만)
    if (isMoving.current) return;

    // 웨이포인트: 모든 머신 순서대로 경유 → 시작점 복귀
    const waypoints: THREE.Vector3[] = machineList
      .filter((m) => machinePositions[m.machine_id])
      .map((m) => {
        const [x, , z] = machinePositions[m.machine_id];
        return new THREE.Vector3(x, 0.5, z);
      });
    waypoints.push(START_POSITION.clone());

    waypointQueue.current = waypoints;
    isMoving.current = true;
  }, [machines, machinePositions]);

  useFrame(() => {
    if (!meshRef.current) return;

    // 이동 중 아니면 시작 위치 유지
    if (!isMoving.current || waypointQueue.current.length === 0) {
      meshRef.current.position.copy(currentPos.current);
      return;
    }

    const target = waypointQueue.current[0];
    currentPos.current.lerp(target, LERP_SPEED);
    meshRef.current.position.copy(currentPos.current);

    // 웨이포인트 도달 확인
    if (currentPos.current.distanceTo(target) < ARRIVE_THRESHOLD) {
      waypointQueue.current.shift();
      if (waypointQueue.current.length === 0) {
        isMoving.current = false;
        currentPos.current.copy(START_POSITION);
      }
    }
  });

  return (
    <mesh ref={meshRef} position={START_POSITION} castShadow>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial
        color="#3b82f6"
        emissive="#1d4ed8"
        emissiveIntensity={0.3}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
}

// ─── GLB 머신 ───────────────────────────────────────────
function SampleMachine({
  machine, position, isSelected, editMode, onClick, onDragStart,
}: {
  machine: any;
  position: [number, number, number];
  isSelected: boolean;
  editMode: boolean;
  onClick: () => void;
  onDragStart: (groupRef: React.RefObject<THREE.Group>) => void;
}) {
  const { scene } = useGLTF("/Glb Test/Glb Test.gltf");
  const cloned = useMemo(() => scene.clone(), [scene]);
  const color = getMachineColor(machine.alarm_level, machine.power);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    groupRef.current?.position.set(...position);
  }, [position]);

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
      ref={groupRef}
      position={position}
      castShadow
      onPointerDown={(e) => {
        if (!editMode) return;
        e.stopPropagation();
        onDragStart(groupRef);
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

// ─── 박스 머신 ──────────────────────────────────────────
function MachineBox({
  machine, position, isSelected, editMode, onClick, onDragStart,
}: {
  machine: any;
  position: [number, number, number];
  isSelected: boolean;
  editMode: boolean;
  onClick: () => void;
  onDragStart: (groupRef: React.RefObject<THREE.Group>) => void;
}) {
  const color = getMachineColor(machine.alarm_level, machine.power);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    groupRef.current?.position.set(...position);
  }, [position]);

  return (
    <group
      ref={groupRef}
      position={position}
      castShadow
      onPointerDown={(e) => {
        if (!editMode) return;
        e.stopPropagation();
        onDragStart(groupRef);
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

// ─── 메인 씬 ────────────────────────────────────────────
export function FactoryScene() {
  const machines = useMachineStore((state) => state.machines);
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

  // ConveyorBox에 넘길 머신 위치 맵
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
      // 팝업 닫기 전에 orbit target을 기계 위치로 동기화 → 시선 틀어짐 방지
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
      {/* 전체보기 버튼 */}
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

        {/* 컨베이어 박스 */}
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
          };
          if (index === 0) return <SampleMachine {...props} />;
          return <MachineBox {...props} />;
        })}

        <OrbitControls ref={orbitRef} makeDefault enabled={!editMode && (cameraTarget === null)} />
      </Canvas>
    </div>
  );
}