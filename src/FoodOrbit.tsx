import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group, Mesh } from 'three';
import * as THREE from 'three';

function CoffeeCup({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!group.current || reducedMotion) return;
    group.current.rotation.y += delta * .34;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * .06 - .08;
  });
  return <group ref={group} rotation={[.22, -.55, 0]}>
    <mesh position={[0, -.46, 0]} receiveShadow>
      <cylinderGeometry args={[.85, .94, .13, 48]} />
      <meshStandardMaterial color="#f7e4d6" roughness={.45} metalness={.08} />
    </mesh>
    <mesh position={[0, -.31, 0]}>
      <cylinderGeometry args={[.68, .75, .12, 48]} />
      <meshStandardMaterial color="#8b2930" roughness={.34} metalness={.2} />
    </mesh>
    <mesh position={[0, .05, 0]} castShadow>
      <cylinderGeometry args={[.58, .49, .7, 48]} />
      <meshStandardMaterial color="#f8ede4" roughness={.34} metalness={.1} />
    </mesh>
    <mesh position={[0, .415, 0]}>
      <cylinderGeometry args={[.49, .49, .027, 48]} />
      <meshStandardMaterial color="#542116" roughness={.18} metalness={.05} />
    </mesh>
    <mesh position={[.59, .06, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <torusGeometry args={[.25, .075, 18, 36]} />
      <meshStandardMaterial color="#f8ede4" roughness={.34} metalness={.1} />
    </mesh>
  </group>;
}

function FloatingBites({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const star = useRef<Mesh>(null);
  useFrame((state, delta) => {
    if (reducedMotion) return;
    const time = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y -= delta * .23;
      group.current.rotation.z = Math.sin(time * .55) * .06;
    }
    if (star.current) {
      star.current.rotation.x += delta * .75;
      star.current.rotation.y += delta * .55;
      star.current.position.y = .58 + Math.sin(time * 1.7) * .08;
    }
  });
  return <group ref={group}>
    <mesh ref={star} position={[.92, .58, .1]} scale={.19} castShadow>
      <octahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#f4b243" metalness={.56} roughness={.18} emissive="#5f2b18" emissiveIntensity={.22} />
    </mesh>
    <mesh position={[-.95, .28, -.12]} scale={[.19, .11, .19]} rotation={[.4, .55, .15]} castShadow>
      <sphereGeometry args={[1, 32, 24]} />
      <meshStandardMaterial color="#d65f4e" roughness={.42} />
    </mesh>
    <mesh position={[-.66, .78, .1]} scale={[.105, .105, .105]} castShadow>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial color="#f7d880" roughness={.35} />
    </mesh>
    <mesh position={[.72, -.08, -.25]} scale={[.12, .12, .12]} castShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#7b3528" roughness={.4} />
    </mesh>
  </group>;
}

function Scene({ reducedMotion }: { reducedMotion: boolean }) {
  const rig = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!rig.current || reducedMotion) return;
    const targetY = state.pointer.x * .34;
    const targetX = -.07 + state.pointer.y * .16;
    rig.current.rotation.y = THREE.MathUtils.damp(rig.current.rotation.y, targetY, 3.2, delta);
    rig.current.rotation.x = THREE.MathUtils.damp(rig.current.rotation.x, targetX, 3.2, delta);
  });
  return <>
    <ambientLight intensity={1.3} />
    <directionalLight position={[3, 4, 3]} intensity={2.2} color="#fff2df" castShadow />
    <pointLight position={[-2, 1, 2]} intensity={9} distance={5} color="#d8565c" />
    <pointLight position={[1, -1, 2]} intensity={6} distance={4} color="#f4b243" />
    <group ref={rig} position={[0, -.02, 0]}>
      <CoffeeCup reducedMotion={reducedMotion} />
      <FloatingBites reducedMotion={reducedMotion} />
    </group>
  </>;
}

export function FoodOrbit() {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return <div className="food-orbit" aria-hidden="true">
    <Canvas dpr={[1, 1.5]} frameloop={reducedMotion ? 'demand' : 'always'} shadows gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }} camera={{ position: [0, .1, 3.6], fov: 36 }} fallback={<span className="food-orbit-fallback">✦</span>}>
      <Scene reducedMotion={reducedMotion} />
    </Canvas>
  </div>;
}
