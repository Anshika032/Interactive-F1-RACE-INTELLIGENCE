"use client";

import { Environment, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom as PostBloom, EffectComposer } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function PodiumBlock({
  position,
  height,
  label,
}: {
  position: [number, number, number];
  height: number;
  label: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, height, 2.2]} />
        <meshStandardMaterial
          color="#2a0a00"
          emissive="#FF4500"
          emissiveIntensity={0.55}
          metalness={0.55}
          roughness={0.22}
        />
      </mesh>
      <mesh position={[0, height + 0.05, 0]}>
        <boxGeometry args={[2.3, 0.12, 2.3]} />
        <meshStandardMaterial color="#FF8C00" emissive="#FF6B00" emissiveIntensity={1.15} />
      </mesh>
      <mesh position={[0, height + 0.22, 0]}>
        <boxGeometry args={[0.55, 0.08, 0.05]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1.8} />
      </mesh>
      <TextPlate text={label} y={height + 0.34} />
    </group>
  );
}

function TextPlate({ text, y }: { text: string; y: number }) {
  return (
    <group position={[0, y, -1.17]}>
      <mesh>
        <boxGeometry args={[0.62, 0.28, 0.04]} />
        <meshStandardMaterial color="#080200" emissive="#FF1500" emissiveIntensity={0.35} />
      </mesh>
      {text.split("").map((_, index) => (
        <mesh key={`${text}-${index}`} position={[-0.2 + index * 0.2, 0, -0.04]}>
          <boxGeometry args={[0.07, 0.16, 0.03]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1.4} />
        </mesh>
      ))}
    </group>
  );
}

function DriftCar() {
  const groupRef = useRef<THREE.Group>(null);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-5.2, 0.34, 2.7),
          new THREE.Vector3(-1.3, 0.34, 4.25),
          new THREE.Vector3(3.4, 0.34, 2.1),
          new THREE.Vector3(1.2, 0.34, -2.7),
          new THREE.Vector3(-3.8, 0.34, -2.0),
          new THREE.Vector3(-1.0, 0.34, 1.0),
          new THREE.Vector3(3.9, 0.34, -0.65),
          new THREE.Vector3(1.2, 0.34, 3.4),
          new THREE.Vector3(-5.2, 0.34, 2.7),
        ],
        true,
      ),
    [],
  );

  useFrame(({ clock }) => {
    const car = groupRef.current;
    if (!car) {
      return;
    }

    const progress = (clock.elapsedTime * 0.065) % 1;
    const position = curve.getPointAt(progress);
    const tangent = curve.getTangentAt(progress).normalize();
    car.position.copy(position);
    car.rotation.y = Math.atan2(tangent.x, tangent.z);
    car.rotation.z = Math.sin(clock.elapsedTime * 2.7) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow>
        <boxGeometry args={[1.35, 0.28, 2.35]} />
        <meshStandardMaterial color="#FF1500" emissive="#FF4500" emissiveIntensity={0.65} />
      </mesh>
      <mesh position={[0, 0.22, -0.08]} castShadow>
        <boxGeometry args={[0.82, 0.24, 1.08]} />
        <meshStandardMaterial color="#120500" metalness={0.4} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.05, 1.35]} castShadow>
        <boxGeometry args={[1.75, 0.08, 0.32]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1.25} />
      </mesh>
      {[[-0.78, -0.12, -0.75], [0.78, -0.12, -0.75], [-0.78, -0.12, 0.76], [0.78, -0.12, 0.76]].map(
        (position) => (
          <mesh key={position.join("-")} position={position as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.16, 18]} />
            <meshStandardMaterial color="#050505" roughness={0.5} />
          </mesh>
        ),
      )}
      <Sparkles count={18} scale={[1.9, 0.35, 1.2]} size={1.8} speed={0.35} color="#AAB4C3" position={[0, 0.05, -1.25]} />
    </group>
  );
}

function Scene() {
  return (
    <>
      <fog attach="fog" args={["#1a0500", 5, 30]} />
      <ambientLight intensity={0.45} />
      <spotLight position={[-4, 7, 4]} angle={0.45} penumbra={0.8} intensity={240} color="#FF6B00" castShadow />
      <spotLight position={[4, 6, -3]} angle={0.5} penumbra={0.7} intensity={160} color="#FFD700" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[18, 14, 1, 1]} />
        <meshStandardMaterial
          color="#080200"
          emissive="#110500"
          metalness={0.75}
          roughness={0.18}
        />
      </mesh>
      <PodiumBlock position={[0, 0, 0]} height={2.25} label="1" />
      <PodiumBlock position={[-2.5, 0, 0.32]} height={1.52} label="2" />
      <PodiumBlock position={[2.5, 0, 0.55]} height={1.12} label="3" />
      <DriftCar />
      <Environment preset="night" />
      <EffectComposer>
        <PostBloom luminanceThreshold={0.2} intensity={2} mipmapBlur />
      </EffectComposer>
      {/* OrbitControls removed temporarily to avoid auto-rotate runtime issues */}
    </>
  );
}

export default function PodiumScene() {
  return (
    <section className="relative z-10 h-[620px] w-full overflow-hidden border-y border-[rgba(255,107,0,0.22)] bg-[rgba(8,2,0,0.58)]">
      <Canvas shadows camera={{ position: [6.4, 4.2, 7.6], fov: 45 }}>
        <Scene />
      </Canvas>
    </section>
  );
}
