// 파일: web/src/components/scene/FactoryScene.tsx
import { useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html, useGLTF } from "@react-three/drei";
import { useSpring } from "@react-spring/three";
import { useMachineStore } from "../../stores/machineStore";
import { MachinePopup } from "./MachinePopup";
import * as THREE from "three";

function getMachineColor(alarmLevel: string, power: string): string {
  if (alarmLevel === "critical") return "#ef4444";
  if (alarmLevel === "warning") return "#f59e0b";
  if (power === "off") return "#9ca3af";
  return "#22c55e";
}

function FloorSlab() {
  return (
    <group position={[0, -0.75, 0]}>
      {/* 콘크리트 바닥 본체 */}
      <mesh receiveShadow>
        <boxGeometry args={[42, 0.4, 32]} />
        <meshStandardMaterial
          color="#9ca3af"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* 외곽 엣지 */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(42, 0.4, 32)]} />
        <lineBasicMaterial color="#e5e7eb" />
      </lineSegments>

      {/* 입체감 — 상단 하이라이트 띠 */}
      {/* 앞면 */}
      <mesh position={[0, 0.22, 16]}>
        <boxGeometry args={[42, 0.04, 0.1]} />
        <meshStandardMaterial color="#d1d5db" emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>
      {/* 뒷면 */}
      <mesh position={[0, 0.22, -16]}>
        <boxGeometry args={[42, 0.04, 0.1]} />
        <meshStandardMaterial color="#d1d5db" emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>
      {/* 좌면 */}
      <mesh position={[-21, 0.22, 0]}>
        <boxGeometry args={[0.1, 0.04, 32]} />
        <meshStandardMaterial color="#d1d5db" emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>
      {/* 우면 */}
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
  machine,
  position,
  isSelected,
  onClick,
}: {
  machine: any;
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}) {
  const { scene } = useGLTF("/Glb Test/Glb Test.gltf");

  return (
    <group position={position}>
      <primitive
        object={scene.clone()}
        scale={10}
        position={[0, -1, 0]}
        onClick={(e: any) => { e.stopPropagation(); onClick(); }}
      />
      <Html position={[0, -1.3, 0]} center distanceFactor={8}>
        <div style={{
          color: "white",
          fontSize: "15px",
          fontWeight: "bold",
          textShadow: "0 0 4px black",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          {machine.machine_id}
        </div>
      </Html>
      {isSelected && (
        <MachinePopup machine={machine} onClose={() => onClick()} />
      )}
    </group>
  );
}

function MachineBox({
  machine,
  position,
  isSelected,
  onClick,
}: {
  machine: any;
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = getMachineColor(machine.alarm_level, machine.power);

  return (
    <group position={position}>
      <mesh castShadow onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? color : "#000000"}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>

      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
        />
      </mesh>

      <Html position={[0, -1.3, 0]} center distanceFactor={8}>
        <div style={{
          color: "white",
          fontSize: "15px",
          fontWeight: "bold",
          textShadow: "0 0 4px black",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          {machine.machine_id}
        </div>
      </Html>

      {isSelected && (
        <MachinePopup machine={machine} onClose={() => onClick()} />
      )}
    </group>
  );
}

export function FactoryScene() {
  const machines = useMachineStore((state) => state.machines);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null);
  const machineList = Object.values(machines);

  const getPosition = (index: number): [number, number, number] => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    return [col * 4 - 8, 0, row * 4 - 6];
  };

  const handleClick = (
    machine_id: string,
    position: [number, number, number]
  ) => {
    if (selectedId === machine_id) {
      setSelectedId(null);
      setCameraTarget(null);
    } else {
      setSelectedId(machine_id);
      setCameraTarget(new THREE.Vector3(...position));
    }
  };

  return (
    <div className="w-full h-full">
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
          const position = getPosition(index);

          if (index === 0) {
            return (
              <SampleMachine
                key={machine.machine_id}
                machine={machine}
                position={position}
                isSelected={selectedId === machine.machine_id}
                onClick={() => handleClick(machine.machine_id, position)}
              />
            );
          }

          return (
            <MachineBox
              key={machine.machine_id}
              machine={machine}
              position={position}
              isSelected={selectedId === machine.machine_id}
              onClick={() => handleClick(machine.machine_id, position)}
            />
          );
        })}

        <OrbitControls makeDefault enabled={cameraTarget === null} />
      </Canvas>
    </div>
  );
}