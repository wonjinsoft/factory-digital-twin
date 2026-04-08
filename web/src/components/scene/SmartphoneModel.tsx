// 파일: web/src/components/scene/SmartphoneModel.tsx
// 역할: 3D 씬 내 스마트폰 오브젝트 — 박스 조합 + 플래시 발광 + 클릭 팝업
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Device } from "../../stores/deviceStore";
import { DevicePopup } from "./DevicePopup";

interface Props {
  device: Device;
  position: [number, number, number];
}

export function SmartphoneModel({ device, position }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const [selected, setSelected] = useState(false);

  const isOn = device.flash === "on";
  const isConnected = device.online === "true";
  const battery = parseInt(device.battery ?? "0", 10);

  // 배터리 잔량에 따른 화면 색상
  const screenColor = !isConnected
    ? "#334155"
    : battery > 50
    ? "#22d3ee"
    : battery > 20
    ? "#facc15"
    : "#ef4444";

  // 플래시 emissive
  const emissiveIntensity = isOn ? 2.5 : 0;

  // 연결 끊김 시 투명도
  const opacity = isConnected ? 1 : 0.4;

  // 미세 부유 애니메이션
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        setSelected((v) => !v);
      }}
    >
      {/* 본체 */}
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.8, 0.06]} />
        <meshStandardMaterial
          color="#1e293b"
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* 화면 */}
      <mesh position={[0, 0.05, 0.035]}>
        <boxGeometry args={[0.32, 0.6, 0.005]} />
        <meshStandardMaterial
          color={screenColor}
          emissive={screenColor}
          emissiveIntensity={isConnected ? 0.6 : 0}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* 홈 버튼 */}
      <mesh position={[0, -0.32, 0.035]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial color="#334155" transparent opacity={opacity} />
      </mesh>

      {/* 플래시 LED */}
      <mesh position={[0.1, 0.34, 0.035]}>
        <circleGeometry args={[0.03, 16]} />
        <meshStandardMaterial
          color={isOn ? "#fef08a" : "#475569"}
          emissive={isOn ? "#fef08a" : "#000000"}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* 플래시 켜졌을 때 PointLight */}
      {isOn && (
        <pointLight
          position={[0.1, 0.34, 0.3]}
          intensity={3}
          distance={6}
          color="#fff9e6"
        />
      )}

      {/* 클릭 팝업 */}
      {selected && (
        <DevicePopup
          device={device}
          onClose={() => setSelected(false)}
        />
      )}
    </group>
  );
}
