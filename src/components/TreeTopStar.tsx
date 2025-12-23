import React, { useRef, useContext, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeContext, TreeContextType } from '../types';

// 创建五角星几何体
const createStarGeometry = (outerRadius: number, innerRadius: number, points: number, depth: number): THREE.ExtrudeGeometry => {
  const shape = new THREE.Shape();
  const angleStep = (Math.PI * 2) / points;

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * angleStep / 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  shape.closePath();

  const extrudeSettings = {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 3
  };

  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
};

interface TreeTopStarProps {
  position: [number, number, number];
}

const TreeTopStar: React.FC<TreeTopStarProps> = ({ position }) => {
  const { state, setShowWishModal, pointer, clickTrigger } = useContext(TreeContext) as TreeContextType;
  const { camera } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const starRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const raysRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const isHovered = useRef(false);
  const hoverScale = useRef(1);
  const rotationSpeed = useRef(0.5);
  const pulsePhase = useRef(0);

  // 创建星星几何体
  const starGeometry = useMemo(() => createStarGeometry(0.5, 0.2, 5, 0.15), []);

  // 检测点击星星
  const lastClickTrigger = useRef(0);

  useFrame((state3d, delta) => {
    if (!groupRef.current || !starRef.current) return;

    const t = state3d.clock.getElapsedTime();
    pulsePhase.current = t;

    // 根据状态调整位置
    const targetY = state === 'FORMED' ? position[1] : position[1] + 3;
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      delta * 2
    );

    // 旋转动画
    starRef.current.rotation.z += rotationSpeed.current * delta;

    // 悬停检测 (通过屏幕空间距离)
    if (pointer) {
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);
      const screenPos = worldPos.clone().project(camera);

      const ndcX = pointer.x * 2 - 1;
      const ndcY = -(pointer.y * 2) + 1;

      const dist = Math.hypot(screenPos.x - ndcX, screenPos.y - ndcY);
      isHovered.current = dist < 0.15 && screenPos.z < 1;

      // 点击检测
      if (isHovered.current && clickTrigger !== lastClickTrigger.current) {
        lastClickTrigger.current = clickTrigger;
        setShowWishModal(true);
      }
    } else {
      isHovered.current = false;
    }

    // 悬停缩放动画
    const targetScale = isHovered.current ? 1.3 : 1;
    hoverScale.current = THREE.MathUtils.lerp(hoverScale.current, targetScale, delta * 8);
    starRef.current.scale.setScalar(hoverScale.current);

    // 呼吸发光效果
    const pulse = 1 + Math.sin(t * 3) * 0.15;
    const glowPulse = 1 + Math.sin(t * 2) * 0.3;

    if (glowRef.current) {
      glowRef.current.scale.setScalar(pulse * 1.5 * hoverScale.current);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(t * 4) * 0.1;
    }

    // 光芒旋转
    if (raysRef.current) {
      raysRef.current.rotation.z -= delta * 0.3;
      raysRef.current.scale.setScalar(glowPulse * hoverScale.current);
    }

    // 光晕效果
    if (haloRef.current) {
      haloRef.current.scale.setScalar(2 + Math.sin(t * 1.5) * 0.5);
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(t * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 外层光晕 */}
      <mesh ref={haloRef} position={[0, 0, -0.2]}>
        <circleGeometry args={[2, 32]} />
        <meshBasicMaterial
          color="#fff8dc"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 光芒射线 */}
      <group ref={raysRef}>
        {[...Array(8)].map((_, i) => (
          <mesh key={i} rotation={[0, 0, (Math.PI * 2 * i) / 8]}>
            <planeGeometry args={[0.08, 2.5]} />
            <meshBasicMaterial
              color="#ffd700"
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* 柔和发光层 */}
      <mesh ref={glowRef} position={[0, 0, -0.1]}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial
          color="#ffee88"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 主星星 */}
      <mesh
        ref={starRef}
        geometry={starGeometry}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0.075]}
        userData={{ isStar: true }}
      >
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffaa00"
          emissiveIntensity={2.5}
          roughness={0.2}
          metalness={0.8}
          toneMapped={false}
        />
      </mesh>

      {/* 中心宝石 */}
      <mesh position={[0, 0, 0.2]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffcc"
          emissiveIntensity={3}
          roughness={0.1}
          metalness={0.9}
          toneMapped={false}
        />
      </mesh>

      {/* 点光源 */}
      <pointLight
        color="#ffd700"
        intensity={3}
        distance={15}
        decay={2}
      />
      <pointLight
        color="#ffffff"
        intensity={1.5}
        distance={8}
        decay={2}
        position={[0, 0, 0.5]}
      />

      {/* 提示文字（悬停时显示） */}
      {isHovered.current && (
        <sprite position={[0, -1, 0]} scale={[2, 0.5, 1]}>
          <spriteMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
          />
        </sprite>
      )}
    </group>
  );
};

export default TreeTopStar;
