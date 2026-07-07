import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Bvh } from '@react-three/drei';
import { useUIStore } from '../store/useUIStore';

const dummy = new THREE.Object3D();
const BASE_COLOR = new THREE.Color('#334455');
const ACTIVE_COLOR = new THREE.Color('#ffffff');
const HOVER_COLOR = new THREE.Color('#88ccff');

export default function InstancedNodes() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const nodes = useUIStore((state) => state.nodes);
  const activeNodeId = useUIStore((state) => state.activeNodeId);
  const setActiveNode = useUIStore((state) => state.setActiveNode);

  // Memoize positions and colors
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(nodes.length * 3);
    const colors = new Float32Array(nodes.length * 3);
    
    nodes.forEach((node, i) => {
      positions[i * 3] = node.umap_x;
      positions[i * 3 + 1] = node.umap_y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // Slight z-depth
      
      BASE_COLOR.toArray(colors, i * 3);
    });
    
    return { positions, colors };
  }, [nodes]);

  // Update instance matrices on mount
  useEffect(() => {
    if (!meshRef.current) return;
    
    for (let i = 0; i < nodes.length; i++) {
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, BASE_COLOR);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [nodes, positions]);

  // Handle active node highlight without React re-renders via WebGL uniforms/colors
  useEffect(() => {
    if (!meshRef.current || !meshRef.current.instanceColor) return;
    
    // Reset all to base color
    for (let i = 0; i < nodes.length; i++) {
      meshRef.current.setColorAt(i, BASE_COLOR);
    }
    
    // Highlight active node
    if (activeNodeId) {
      const index = nodes.findIndex((n) => n.spotify_track_id === activeNodeId);
      if (index !== -1) {
        meshRef.current.setColorAt(index, ACTIVE_COLOR);
      }
    }
    
    meshRef.current.instanceColor.needsUpdate = true;
  }, [activeNodeId, nodes]);

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId === undefined || !meshRef.current || !meshRef.current.instanceColor) return;
    
    // Don't overwrite if it's the active node
    const hoveredNode = nodes[instanceId];
    if (hoveredNode.spotify_track_id === activeNodeId) return;

    meshRef.current.setColorAt(instanceId, HOVER_COLOR);
    meshRef.current.instanceColor.needsUpdate = true;
    
    // Changing cursor style bypasses React re-render of canvas wrapper
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId === undefined || !meshRef.current || !meshRef.current.instanceColor) return;
    
    const node = nodes[instanceId];
    if (node.spotify_track_id !== activeNodeId) {
      meshRef.current.setColorAt(instanceId, BASE_COLOR);
      meshRef.current.instanceColor.needsUpdate = true;
    }
    
    document.body.style.cursor = 'default';
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined) {
      const node = nodes[instanceId];
      // Update global UI store - UI Overlays and future Audio module listen to this
      setActiveNode(node.spotify_track_id, true);
    }
  };

  return (
    <Bvh firstHitOnly>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, nodes.length]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        frustumCulled={true}
      >
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </Bvh>
  );
}
