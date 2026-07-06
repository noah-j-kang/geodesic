### **Sub-Project: WebGL Manifold**

**1) Description**

The WebGL Manifold is the visual and interactive core of the TopoAcoustic Discovery Engine. By discarding traditional, linear grids of album artwork, this module projects the high-dimensional mathematical space of music into a perceivable, continuous 2D or 3D coordinate system (utilizing UMAP representations of the Persistence Landscapes).

Operating under the "Cartographer of the Void" aesthetic, this canvas treats music as a physical territory. Its primary function is to render thousands of individual audio tracks as geometric nodes of light floating in a dark void. It allows the user to pan, zoom, and visually digest the complex topological clusters of music, effectively translating the abstract math of the backend into a highly responsive, spatial playground.

**2) Architecture & Logic**

- **Pattern:** Data-Driven `InstancedMesh` / Render Loop Architecture.
    
- **Pipeline Logic:**
    
    1. **Initialization:** The React `<Canvas>` mounts, establishing the WebGL context, the deep-space background color, and the physics-based camera.
        
    2. **Data Hydration:** It reads the array of `umap_coords` from the global `useUIStore` (Zustand).
        
    3. **Instanced Rendering:** To prevent the GPU from frying, it does _not_ create 10,000 individual 3D objects. Instead, it utilizes a single `THREE.InstancedMesh` (or particle system), drawing a single geometric shape 10,000 times in a single draw call, varying only the position and color parameters via a Float32 buffer array.
        
    4. **Geodesic Camera Interpolation:** Inside the native `useFrame` render loop, the camera constantly listens for changes to the `target_vector` state. When updated, the camera uses a linear interpolation (`lerp`) or spring physics to smoothly glide to the new coordinate without requiring React re-renders.
        
    5. **Raycasting & Interaction:** Uses a highly optimized Bounding Volume Hierarchy (BVH) raycaster to detect when the user's mouse hovers over or clicks a specific point of light, illuminating its nearest topological neighbors (edges) and triggering global state updates.
        

**3) Tech Stack & Libraries**

- **Language:** TypeScript
    
- **Graphics Engine:** `three.js` (Core WebGL wrapper).
    
- **React Binding:** `@react-three/fiber` (R3F) and `@react-three/drei` (for optimized camera controls and instancing helpers).
    
- **State Sync:** `zustand` (Reads API data and writes user interactions back to the DOM layer).
    
- **Math/Physics:** `three-mesh-bvh` (for high-speed raycasting over 10,000+ instances without dropping frames).
    

**4) Inputs (Ingress)**

- **Source:** Global UI Store (Zustand), populated by the API Gateway.
    
- **Payload Schema (TypeScript Interface - Node Data):**
    
    TypeScript
    
    ```
    interface ManifoldState {
      cameraTarget: [number, number, number]; // [x, y, z] UMAP projection
      nodes: Array<{
        spotify_track_id: string;
        umap_x: number;
        umap_y: number;
        is_active: boolean;
        distance_l2: number;
      }>;
    }
    ```
    

**5) Outputs (Egress)**

- **Destination:** The User's Screen (Visual) & Global UI Store (State).
    
- **Output Payload Schema (Writing to Zustand on Click/Hover):**
    
    TypeScript
    
    ```
    // Emitted when a user explicitly clicks a node in the void
    interface NodeSelectionEvent {
      selected_track_id: string;
      new_center_coordinates: [number, number];
      trigger_audio_autoplay: boolean;
    }
    ```
    

**6) Failure States**

- **WebGL Context Lost:** The browser reallocates GPU resources (often happens if the user opens a heavy game in another tab or the device sleeps). _Recovery:_ Catch the `webglcontextlost` event. Display a graceful fallback UI ("Re-initializing Canvas...") and use R3F's auto-recovery to rebuild the scene without refreshing the page.
    
- **Mobile GPU Throttling (OOM):** A low-end mobile device cannot handle the 10,000-node `InstancedMesh`. _Recovery:_ The component actively monitors frames-per-second (`fps`). If `fps` drops below 20 for 3 consecutive seconds, it triggers a "Degradation Mode," culling the rendered nodes down to the nearest 1,000 and disabling the drawing of connective geometric edges.
    
- **Empty Data Array:** The API returns 0 nodes. _Recovery:_ Render the deep void with a single pulsing center light and a UI prompt overlay: "Acoustic space empty. Adjust parameters to discover new geometry."
    

**7) Performance Constraints**

- **Frame Rate (SLA):** The canvas MUST maintain a steady **$\ge 60 \text{ fps}$** during camera movement and slider adjustments. Dropping below 60fps breaks the illusion of physical space.
    
- **Draw Calls:** Strict adherence to instancing. The entire 10,000-node point cloud must be rendered in **$\le 5$ WebGL draw calls**.
    
- **Render Loop Isolation:** The `useFrame` hook must never trigger a parent React state update unless specifically communicating a user click. Hover states (e.g., node glowing) must be handled by updating instance colors directly via WebGL shaders or uniform variables, bypassing the React reconciliation engine entirely.
    

**8) Validation Strategy**

- **GPU Profiling:** Mount the canvas with a synthetic dataset of 50,000 nodes. Use the Chrome DevTools Performance monitor and the `stats.js` overlay. Assert that panning the camera across the full bounds of the dataset does not cause the GPU frame time to exceed 16.6ms per frame.
    
- **Memory Leak Auditing:** Programmatically simulate the user jumping to 20 different topological coordinates (unloading and loading new node clusters). Monitor the WebGL memory footprint. Assert that `THREE.BufferGeometry` and `THREE.Material` counts do not incrementally climb, proving that the garbage collector is successfully disposing of old meshes.
    
- **Raycasting Stress Test:** Move the mouse erratically across the canvas for 10 seconds. Assert that the BVH raycaster successfully identifies the intersected instances without causing main-thread locking or visual stuttering.