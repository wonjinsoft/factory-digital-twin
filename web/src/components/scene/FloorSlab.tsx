// 파일: web/src/components/scene/FloorSlab.tsx
import { useMemo } from "react";
import * as THREE from "three";

function createFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  // 바탕색 — 콘크리트 회색
  ctx.fillStyle = "#d1d5db";
  ctx.fillRect(0, 0, 1024, 1024);

  // 미세한 노이즈 (콘크리트 질감)
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const brightness = 180 + Math.random() * 40;
    ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // 격자 라인 — 공장 바닥 구획선
  ctx.strokeStyle = "#b0b5bc";
  ctx.lineWidth = 2;
  const gridSize = 1024 / 8;
  for (let i = 1; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0);
    ctx.lineTo(i * gridSize, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * gridSize);
    ctx.lineTo(1024, i * gridSize);
    ctx.stroke();
  }

  // 안전 구역 표시 — 노란색 경계선
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 6;
  ctx.setLineDash([20, 10]);
  ctx.strokeRect(40, 40, 944, 944);
  ctx.setLineDash([]);

  // 통로 표시
  ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
  ctx.fillRect(480, 0, 64, 1024);  // 세로 중앙 통로
  ctx.fillRect(0, 480, 1024, 64);  // 가로 중앙 통로

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

export function FloorSlab() {
  const floorTexture = useMemo(() => createFloorTexture(), []);

  return (
    <group position={[0, -0.75, 0]}>
      {/* 메인 바닥 */}
      <mesh receiveShadow>
        <boxGeometry args={[42, 0.4, 32]} />
        <meshStandardMaterial
          map={floorTexture}
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>
      {/* 테두리 */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(42, 0.4, 32)]} />
        <lineBasicMaterial color="#9ca3af" />
      </lineSegments>
      {/* 벽면 하단 가드레일 */}
      <mesh position={[0, 0.22, 16]}>
        <boxGeometry args={[42, 0.06, 0.15]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[0, 0.22, -16]}>
        <boxGeometry args={[42, 0.06, 0.15]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[-21, 0.22, 0]}>
        <boxGeometry args={[0.15, 0.06, 32]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[21, 0.22, 0]}>
        <boxGeometry args={[0.15, 0.06, 32]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.1} />
      </mesh>
    </group>
  );
}
