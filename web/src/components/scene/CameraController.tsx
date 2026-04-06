// 파일: web/src/components/scene/CameraController.tsx
import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type CameraTarget = THREE.Vector3 | "overview" | null;

const CAM_SPEED = 0.05;

export function CameraController({ target }: { target: CameraTarget }) {
  const { camera } = useThree();
  const targetRef = useRef(target);
  targetRef.current = target;

  const goalPos  = useRef(new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z));
  const goalLook = useRef(new THREE.Vector3(0, 0, 0));
  const curLook  = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    curLook.current.copy(camera.position).addScaledVector(dir, 10);
  }, []);

  useEffect(() => {
    if (!target) return;
    if (target === "overview") {
      goalPos.current.set(0, 15, 20);
      goalLook.current.set(0, 0, 0);
    } else {
      const t = target as THREE.Vector3;
      goalPos.current.set(t.x, t.y + 6, t.z + 8);
      goalLook.current.copy(t);
    }
  }, [target]);

  useFrame(() => {
    if (!targetRef.current) return;
    camera.position.lerp(goalPos.current, CAM_SPEED);
    curLook.current.lerp(goalLook.current, CAM_SPEED);
    camera.lookAt(curLook.current);
  });

  return null;
}
