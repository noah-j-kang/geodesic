### **Workstream 4: Client Application (Frontend)**

**1) Description of the Workstream**

The Client Application is the interactive, visual manifestation of the TopoAcoustic Discovery Engine. Operating under the "Cartographer of the Void" design philosophy, it completely abandons traditional list-based UI layouts in favor of a spatial, non-linear exploratory environment.

This workstream is divided into two highly distinct architectural layers that must operate in parallel without blocking one another: the **Canvas Layer** and the **DOM Layer**. The Canvas Layer utilizes WebGL to render thousands of music tracks as a continuous geometric manifold (UMAP projection), allowing users to physically pan and zoom through acoustic space. The DOM Layer consists of React-driven, floating UI overlays—such as the Semantic Command Line, Topological HUD, and Active Node Player—that handle user inputs, API communication, and audio playback. The primary engineering challenge of this workstream is state management: ensuring that rapid UI slider updates and React re-renders do not cause frame drops or stuttering in the 60fps WebGL rendering loop.

**2) Definition of Done (DoD) / Key Deliverables**

To consider Workstream 4 complete and ready for production, the following conditions must be met and verifiable:

- **High-Performance Canvas Rendering:** The WebGL environment successfully renders a minimum of 10,000 independent vector nodes based on their UMAP `[x, y]` coordinates, maintaining a consistent frame rate of $\ge 60 \text{ fps}$ during continuous pan and zoom operations.
    
- **Geodesic Camera Interpolation:** When a user initiates a jump (via the Semantic Command Line or HUD), the camera completely detaches from manual control and smoothly interpolates to the new target coordinate using a physics-based easing curve, without abrupt jumping or visual tearing.
    
- **Topological HUD Integration:** The floating right-hand HUD successfully captures user slider adjustments (e.g., Timbral Density, Cyclic Frequency) and streams those delta updates to the API Gateway via WebSocket (or debounced HTTP), instantly reflecting the new topological target on the canvas.
    
- **Semantic Command Line Execution:** The top-center command line accepts natural language inputs, fires the request to the API, and successfully interprets the returned parsed parameters, updating the HUD sliders to match the text prompt's acoustic profile.
    
- **Audio Playback & Proximity Display:** Hovering or clicking on an active node successfully pulls the track's metadata and 30-second `.mp3` preview URL, streaming the audio seamlessly while displaying the exact mathematical Wasserstein ($\mathcal{W}_p$) distance to the user's current spatial center.
    
- **Seamless Session Rehydration:** Upon successful authentication, the frontend successfully requests the user's last known state from the API and instantly rehydrates the WebGL canvas, snapping the camera to the exact coordinates where the user ended their previous session.