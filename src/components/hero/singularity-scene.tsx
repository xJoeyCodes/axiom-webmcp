"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  createAccretionParticles,
  createSingularityStars,
  singularityTiers,
  type SingularityQuality,
} from "./singularity-particles";
import {
  diskVertexShader,
  diskFragmentShader,
  hazeVertexShader,
  hazeFragmentShader,
  rimVertexShader,
  rimFragmentShader,
} from "./singularity-shaders";

interface SceneProps {
  quality: SingularityQuality;
  active: boolean;
  reducedMotion: boolean;
  onReady: () => void;
  onFailure: () => void;
}

function SingularityContent({
  quality,
  active,
  reducedMotion,
  onReady,
  onFailure,
}: SceneProps) {
  const tier = singularityTiers[quality];
  const system = useRef<THREE.Group>(null);
  const time = useRef(0);
  const diskMaterial = useRef<THREE.ShaderMaterial>(null);
  const target = useRef({ x: 0, y: 0 });
  const rendered = useRef(false);
  const { gl, size } = useThree();
  const diskGeometry = useMemo(() => {
    const field = createAccretionParticles(tier.particles);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(field.positions, 3),
    );
    geometry.setAttribute("aOrbit", new THREE.BufferAttribute(field.orbits, 4));
    return geometry;
  }, [tier.particles]);
  const starGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(createSingularityStars(tier.stars), 3),
    );
    return geometry;
  }, [tier.stars]);
  // Own the whole geometry so removed attributes are disposed with their GPU buffers.
  useEffect(() => () => diskGeometry.dispose(), [diskGeometry]);
  useEffect(() => () => starGeometry.dispose(), [starGeometry]);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: tier.dpr } }),
    [tier.dpr],
  );

  useEffect(() => {
    const canvas = gl.domElement;
    function lost(event: Event) {
      event.preventDefault();
      onFailure();
    }
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);

  useEffect(() => {
    if (
      !active ||
      reducedMotion ||
      quality === "low" ||
      !window.matchMedia("(pointer: fine)").matches
    )
      return;
    function move(event: PointerEvent) {
      target.current.x =
        THREE.MathUtils.clamp(
          event.clientX / window.innerWidth - 0.5,
          -0.5,
          0.5,
        ) * 0.025;
      target.current.y =
        THREE.MathUtils.clamp(
          event.clientY / window.innerHeight - 0.5,
          -0.5,
          0.5,
        ) * 0.015;
    }
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [active, reducedMotion, quality]);

  useFrame((_, delta) => {
    if (!active || reducedMotion) return;
    const step = Math.min(delta, 0.05);
    time.current += step;
    if (diskMaterial.current)
      diskMaterial.current.uniforms.uTime.value = time.current;
    if (system.current) {
      system.current.rotation.y = THREE.MathUtils.damp(
        system.current.rotation.y,
        target.current.x,
        1.5,
        step,
      );
      system.current.rotation.z = THREE.MathUtils.damp(
        system.current.rotation.z,
        -0.09 + target.current.y,
        1.5,
        step,
      );
    }
  });

  return (
    <>
      <points geometry={starGeometry}>
        <pointsMaterial
          color="#cccccc"
          size={0.018}
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </points>
      <group
        ref={system}
        position={[0, 0.65, 0]}
        rotation={[0, 0, -0.09]}
        scale={size.width / size.height < 0.8 ? 0.72 : 1}
      >
        <mesh
          onAfterRender={() => {
            if (!rendered.current) {
              rendered.current = true;
              onReady();
            }
          }}
        >
          <sphereGeometry args={[0.87, 48, 32]} />
          <shaderMaterial
            vertexShader={rimVertexShader}
            fragmentShader={rimFragmentShader}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.98, 5.22, 128]} />
          <shaderMaterial
            vertexShader={hazeVertexShader}
            fragmentShader={hazeFragmentShader}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <points geometry={diskGeometry} frustumCulled={false}>
          <shaderMaterial
            ref={diskMaterial}
            uniforms={uniforms}
            vertexShader={diskVertexShader}
            fragmentShader={diskFragmentShader}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </>
  );
}

export function SingularityScene(props: SceneProps) {
  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, singularityTiers[props.quality].dpr]}
      frameloop={props.active && !props.reducedMotion ? "always" : "demand"}
      camera={{ position: [0, 4.1, 9.8], fov: 46, near: 0.1, far: 50 }}
      gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 0, 0);
        gl.debug.onShaderError = () => props.onFailure();
      }}
      fallback={null}
    >
      <SingularityContent {...props} />
    </Canvas>
  );
}
