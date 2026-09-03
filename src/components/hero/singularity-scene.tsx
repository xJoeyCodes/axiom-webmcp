"use client";

import { Line } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function seededRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function createParticleField(
  count: number,
  innerRadius: number,
  outerRadius: number,
) {
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const radius =
      innerRadius +
      Math.pow(seededRandom(index + 1), 1.45) * (outerRadius - innerRadius);
    const angle = seededRandom(index + 401) * Math.PI * 2;
    const depth = (seededRandom(index + 809) - 0.5) * 0.62;

    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = Math.sin(angle) * radius * 0.36;
    positions[index * 3 + 2] = depth * (radius / outerRadius);
  }

  return positions;
}

function createOrbit(radius: number, depth: number) {
  return Array.from({ length: 97 }, (_, index) => {
    const angle = (index / 96) * Math.PI * 2;
    return new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      Math.sin(angle * 2) * depth,
    );
  });
}

interface SingularityContentProps {
  reducedMotion: boolean;
}

function SingularityContent({ reducedMotion }: SingularityContentProps) {
  const system = useRef<THREE.Group>(null);
  const particles = useRef<THREE.Points>(null);
  const positions = useMemo(() => createParticleField(340, 1.05, 4.1), []);
  const innerOrbit = useMemo(() => createOrbit(1.72, 0.08), []);
  const middleOrbit = useMemo(() => createOrbit(2.55, 0.16), []);
  const outerOrbit = useMemo(() => createOrbit(3.45, 0.24), []);

  useFrame((state, delta) => {
    if (reducedMotion || !system.current) return;

    system.current.rotation.x = THREE.MathUtils.damp(
      system.current.rotation.x,
      state.pointer.y * 0.035 - 0.12,
      2.2,
      delta,
    );
    system.current.rotation.y = THREE.MathUtils.damp(
      system.current.rotation.y,
      state.pointer.x * 0.045,
      2.2,
      delta,
    );
    system.current.rotation.z += delta * 0.006;

    if (particles.current) particles.current.rotation.z -= delta * 0.012;
  });

  return (
    <group ref={system} rotation={[-0.12, 0, 0.08]}>
      <points ref={particles} rotation={[0.22, 0.08, -0.08]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#e8e8e8"
          size={0.018}
          sizeAttenuation
          transparent
          opacity={0.45}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <Line
        points={innerOrbit}
        color="#d7d7d7"
        lineWidth={0.35}
        transparent
        opacity={0.16}
        rotation={[1.08, 0.18, 0.14]}
      />
      <Line
        points={middleOrbit}
        color="#b8b8b8"
        lineWidth={0.3}
        transparent
        opacity={0.11}
        rotation={[1.19, -0.12, -0.2]}
      />
      <Line
        points={outerOrbit}
        color="#ffffff"
        lineWidth={0.25}
        transparent
        opacity={0.075}
        rotation={[1.26, 0.06, 0.27]}
      />

      <mesh>
        <sphereGeometry args={[0.9, 48, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh rotation={[1.54, 0, 0]}>
        <torusGeometry args={[0.98, 0.008, 8, 160]} />
        <meshBasicMaterial color="#d8d8d8" transparent opacity={0.28} />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[0.9, 24, 24]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.022}
          wireframe
        />
      </mesh>
    </group>
  );
}

export function SingularityScene() {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, 1.35]}
      frameloop={reducedMotion ? "demand" : "always"}
      camera={{ position: [0, 0, 7.2], fov: 44, near: 0.1, far: 30 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      }}
      fallback={null}
    >
      <SingularityContent reducedMotion={reducedMotion} />
    </Canvas>
  );
}
