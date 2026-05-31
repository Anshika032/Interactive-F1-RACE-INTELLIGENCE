'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
  ContactShadows,
} from '@react-three/drei'

import { EffectComposer, Bloom } from '@react-three/postprocessing'

import { useRef } from 'react'
import * as THREE from 'three'

function CarModel() {
  const group = useRef<THREE.Group>(null)

  const { scene } = useGLTF('/models/f1.glb')

  // Enable shadows on all meshes

  scene.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    if (group.current) {
      group.current.rotation.y =
        Math.sin(t * 0.3) * 0.08

      group.current.position.y =
        Math.sin(t * 1.5) * 0.03
    }
  })

  return (
    <group ref={group}>
      <primitive
        object={scene}
        scale={1.8}
        position={[0, -1.2, 1]}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  )
}

export default function F1CarScene() {
  return (
    <div className="w-full h-screen">
      <Canvas shadows>

        <PerspectiveCamera
          makeDefault
          position={[0, 1.2, 7]}
          fov={35}
        />

        {/* LIGHTING */}

        <ambientLight intensity={0.08} />

        <directionalLight
          position={[5, 10, 5]}
          intensity={2}
          castShadow
        />

        <spotLight
          position={[-8, 6, 6]}
          intensity={3}
          angle={0.35}
          penumbra={1}
          color="#ff5a00"
          castShadow
        />

        <pointLight
          position={[0, 2, -5]}
          intensity={1}
          color="#ff2200"
        />

        {/* Blue cinematic contrast light */}
        <pointLight
          position={[5, 2, -4]}
          intensity={1.5}
          color="#0033ff"
        />

        {/* ENVIRONMENT */}

        <Environment preset="warehouse" />

        {/* CAR */}

        <CarModel />

        {/* FLOOR */}

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.5, 0]}
          receiveShadow
        >
          <planeGeometry args={[50, 50]} />

          <meshStandardMaterial
            color="#050505"
            metalness={1}
            roughness={0.08}
          />
        </mesh>

        {/* SHADOWS */}

        <ContactShadows
          position={[0, -1.49, 0]}
          opacity={0.7}
          scale={15}
          blur={2.5}
          far={5}
        />

        {/* POSTPROCESSING */}

        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.2}
          />
        </EffectComposer>

        {/* CAMERA CONTROL */}

        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.3}
        />

      </Canvas>
    </div>
  )
}