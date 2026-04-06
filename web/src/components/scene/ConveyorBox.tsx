// 파일: web/src/components/scene/ConveyorBox.tsx
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useMachineStore } from "../../stores/machineStore";
import * as THREE from "three";

const START_POSITION = new THREE.Vector3(-14, 0.5, -10);
const LERP_SPEED = 0.05;
const ARRIVE_THRESHOLD = 0.15;

export function ConveyorBox({
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
    if (isMoving.current) return;

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

    if (!isMoving.current || waypointQueue.current.length === 0) {
      meshRef.current.position.copy(currentPos.current);
      return;
    }

    const target = waypointQueue.current[0];
    currentPos.current.lerp(target, LERP_SPEED);
    meshRef.current.position.copy(currentPos.current);

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
