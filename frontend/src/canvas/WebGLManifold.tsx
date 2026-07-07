import { Canvas, useFrame } from '@react-three/fiber';
import { MapControls, Stats } from '@react-three/drei';
import * as THREE from 'three';
import InstancedNodes from './InstancedNodes';
import { useUIStore } from '../store/useUIStore';

// Camera controller component inside canvas
function CameraRig() {
  const cameraTarget = useUIStore((state) => state.cameraTarget);
  const targetVec = new THREE.Vector3();

  useFrame((state) => {
    // Geodesic Camera Interpolation using lerp
    targetVec.set(...cameraTarget);
    // Smoothly pan camera towards target
    state.camera.position.lerp(targetVec, 0.05); // Spring physics approximation
  });

  return null;
}

export default function WebGLManifold() {
  return (
    <div className="absolute inset-0 z-0 bg-[#050505]">
      <Canvas
        camera={{ position: [0, 0, 50], fov: 60, near: 0.1, far: 1000 }}
        dpr={[1, 2]} // Optimize for high-DPI displays while maintaining perf
        gl={{ antialias: false, powerPreference: "high-performance" }} // Favor performance
      >
        <color attach="background" args={['#050505']} />
        
        {/* The visual core - thousands of interactive points */}
        <InstancedNodes />
        
        {/* Reactively adjusts camera to Zustand store target without React re-renders */}
        <CameraRig />
        
        {/* Allows user to physically pan and zoom through acoustic space */}
        <MapControls 
          makeDefault 
          enableDamping 
          dampingFactor={0.05}
          maxDistance={200}
          minDistance={5}
        />
        
        {/* Performance stats overlaid inside the WebGL context bounds */}
        <Stats />
      </Canvas>
    </div>
  );
}
