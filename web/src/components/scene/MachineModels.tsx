// 파일: web/src/components/scene/MachineModels.tsx
// 역할: 설비 3D 모델 — GLB(M001) + 4가지 프로시저럴 타입(M002~M020)
import { useEffect, useMemo, useRef } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { Machine } from "../../stores/machineStore";
import { MachinePopup } from "./MachinePopup";
import { getMachineColor } from "./machineColor";
import * as THREE from "three";

export interface MachineComponentProps {
  machine: Machine;
  position: [number, number, number];
  isSelected: boolean;
  editMode: boolean;
  onClick: () => void;
  onDragStart: (groupRef: React.RefObject<THREE.Group>) => void;
  onOverview: () => void;
}

// ─── 공통 라벨 + 팝업 ──────────────────────────────────
function MachineLabel({ machine, editMode, isSelected, onClick, onOverview }: {
  machine: Machine; editMode: boolean; isSelected: boolean; onClick: () => void; onOverview: () => void;
}) {
  return (
    <>
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
        <MachinePopup machine={machine} onClose={onClick} onOverview={onOverview} />
      )}
    </>
  );
}

// ─── 설비 타입 결정 ─────────────────────────────────────
type MachineType = "robotArm" | "conveyor" | "cnc" | "inspector";

function getMachineType(machineId: string): MachineType {
  const num = parseInt(machineId.replace("M", ""), 10);
  const types: MachineType[] = ["robotArm", "conveyor", "cnc", "inspector"];
  return types[(num - 2) % 4]; // M002부터 순환
}

// ─── 로봇암 타입 ────────────────────────────────────────
function RobotArmModel({ color, isSelected }: { color: string; isSelected: boolean }) {
  return (
    <group>
      {/* 베이스 */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.9, 0.4, 16]} />
        <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* 하단 암 */}
      <mesh castShadow position={[0, 0.7, 0]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.3, 1.2, 0.3]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? color : "#000000"}
          emissiveIntensity={isSelected ? 0.3 : 0}
          metalness={0.4} roughness={0.4}
        />
      </mesh>
      {/* 상단 암 */}
      <mesh castShadow position={[0.3, 1.4, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? color : "#000000"}
          emissiveIntensity={isSelected ? 0.3 : 0}
          metalness={0.4} roughness={0.4}
        />
      </mesh>
      {/* 관절 */}
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* 상태 표시등 */}
      <mesh position={[0, 1.9, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ─── 컨베이어 타입 ──────────────────────────────────────
function ConveyorModel({ color, isSelected }: { color: string; isSelected: boolean }) {
  return (
    <group>
      {/* 벨트 */}
      <mesh castShadow>
        <boxGeometry args={[2.4, 0.15, 0.8]} />
        <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* 다리 */}
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} castShadow position={[x, -0.4, 0]}>
          <boxGeometry args={[0.15, 0.7, 0.7]} />
          <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* 롤러 */}
      {[-0.8, -0.3, 0.2, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.85, 8]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.2} />
        </mesh>
      ))}
      {/* 가드레일 */}
      <mesh position={[0, 0.3, 0.45]}>
        <boxGeometry args={[2.4, 0.08, 0.05]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? color : "#000000"}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
      <mesh position={[0, 0.3, -0.45]}>
        <boxGeometry args={[2.4, 0.08, 0.05]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? color : "#000000"}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
      {/* 상태 표시등 */}
      <mesh position={[1.1, 0.5, 0]}>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ─── CNC 가공기 타입 ────────────────────────────────────
function CncModel({ color, isSelected }: { color: string; isSelected: boolean }) {
  return (
    <group>
      {/* 본체 */}
      <mesh castShadow>
        <boxGeometry args={[1.6, 1.4, 1.2]} />
        <meshStandardMaterial
          color="#4b5563"
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>
      {/* 도어 */}
      <mesh position={[0, 0, 0.61]}>
        <boxGeometry args={[1.0, 1.0, 0.03]} />
        <meshStandardMaterial
          color="#6b7280"
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>
      {/* 도어 창문 */}
      <mesh position={[0, 0.15, 0.63]}>
        <boxGeometry args={[0.6, 0.5, 0.01]} />
        <meshStandardMaterial
          color="#1e3a5f"
          metalness={0.1}
          roughness={0.1}
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* 컨트롤 패널 */}
      <mesh position={[0.85, 0.3, 0]}>
        <boxGeometry args={[0.08, 0.5, 0.6]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? color : "#000000"}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
      {/* 상태 표시등 */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ─── 검사기 타입 ────────────────────────────────────────
function InspectorModel({ color, isSelected }: { color: string; isSelected: boolean }) {
  return (
    <group>
      {/* 테이블 */}
      <mesh castShadow position={[0, -0.1, 0]}>
        <boxGeometry args={[1.4, 0.15, 1.0]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* 다리 */}
      {[[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.5, z]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {/* 카메라 마운트 */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[0.12, 1.2, 0.12]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 카메라 헤드 */}
      <mesh position={[0, 1.15, 0.15]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.3, 0.2, 0.25]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? color : "#000000"}
          emissiveIntensity={isSelected ? 0.3 : 0}
          metalness={0.4} roughness={0.3}
        />
      </mesh>
      {/* 렌즈 */}
      <mesh position={[0, 1.1, 0.32]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.08, 12]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.8} roughness={0.1} />
      </mesh>
      {/* 상태 표시등 */}
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ─── GLB 머신 (M001) ────────────────────────────────────
export function SampleMachine({
  machine, position, isSelected, editMode, onClick, onDragStart, onOverview,
}: MachineComponentProps) {
  const { scene } = useGLTF("/Glb Test/Glb Test.gltf");
  const cloned = useMemo(() => scene.clone(), [scene]);
  const color = getMachineColor(machine.alarm_level, machine.power);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    groupRef.current?.position.set(...position);
  }, [position]);

  useEffect(() => {
    const targetColor = new THREE.Color(color);
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
          const stdMat = mat as THREE.MeshStandardMaterial;
          stdMat.color.lerp(targetColor, 0.6);
          stdMat.emissive = new THREE.Color(
            machine.alarm_level === "critical" ? "#ef4444" :
            machine.alarm_level === "warning"  ? "#f59e0b" : "#000000"
          );
          stdMat.emissiveIntensity =
            machine.alarm_level === "critical" ? 0.4 :
            machine.alarm_level === "warning"  ? 0.25 : 0;
          stdMat.needsUpdate = true;
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
        onClick={(e: { stopPropagation: () => void }) => {
          if (editMode || isSelected) return;
          e.stopPropagation();
          onClick();
        }}
      />
      <MachineLabel machine={machine} editMode={editMode} isSelected={isSelected} onClick={onClick} onOverview={onOverview} />
    </group>
  );
}

// ─── 프로시저럴 머신 (M002~M020) ────────────────────────
export function MachineBox({
  machine, position, isSelected, editMode, onClick, onDragStart, onOverview,
}: MachineComponentProps) {
  const color = getMachineColor(machine.alarm_level, machine.power);
  const groupRef = useRef<THREE.Group>(null);
  const machineType = getMachineType(machine.machine_id);

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
      onClick={(e) => {
        if (editMode || isSelected) return;
        e.stopPropagation();
        onClick();
      }}
    >
      {machineType === "robotArm" && <RobotArmModel color={color} isSelected={isSelected} />}
      {machineType === "conveyor" && <ConveyorModel color={color} isSelected={isSelected} />}
      {machineType === "cnc" && <CncModel color={color} isSelected={isSelected} />}
      {machineType === "inspector" && <InspectorModel color={color} isSelected={isSelected} />}
      <MachineLabel machine={machine} editMode={editMode} isSelected={isSelected} onClick={onClick} onOverview={onOverview} />
    </group>
  );
}
