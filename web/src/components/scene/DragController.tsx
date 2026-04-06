// 파일: web/src/components/scene/DragController.tsx
import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface DragState {
  draggingId: string | null;
  groupRef: React.RefObject<THREE.Group> | null;
}

export function DragController({
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
    const updateMouse = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      mouse.current.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
    };
    const onMouseMove = (e: MouseEvent) => updateMouse(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (dragState.current.draggingId && e.touches.length === 1) {
        e.preventDefault();
        updateMouse(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onEnd = () => {
      if (dragState.current.draggingId && dragState.current.groupRef?.current) {
        const pos = dragState.current.groupRef.current.position;
        onDragEnd(dragState.current.draggingId, pos.x, pos.z);
      }
      dragState.current.draggingId = null;
      dragState.current.groupRef = null;
    };
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseup", onEnd);
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseup", onEnd);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onEnd);
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
