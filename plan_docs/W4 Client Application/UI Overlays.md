### **Sub-Project: UI Overlays**

**1) Description**

The UI Overlays module represents the 2D traditional DOM elements that float directly above the interactive WebGL Canvas. Operating under the "Cartographer of the Void" design philosophy, these overlays are styled with dark graphite backgrounds, frosted glass (backdrop blur), and strict monospace typography. This module contains the Semantic Command Line (for NLP searches), the Topological HUD (for geodesic slider adjustments), and the Authentication/Profile routing elements.

The primary purpose of this module is to provide the user with tangible, human-friendly controls to navigate the abstract mathematical space. Crucially, it acts as a protective buffer: it captures user intent, translates it into state changes, and communicates with the backend, all while being architecturally decoupled from the WebGL canvas to ensure that interacting with the UI does not cause the 3D/2D rendering engine to stutter or drop frames.

**2) Architecture & Logic**

- **Pattern:** Flux Architecture (via Zustand) / Decoupled DOM Overlay.
    
- **Pipeline Logic:**
    
    1. **Z-Index Layering:** The React application is split. The `<Canvas>` component sits at `z-0`. The UI overlays sit at `z-10` to `z-50` using absolute positioning, completely detached from the canvas's React tree.
        
    2. **Global Store (Zustand):** A `useUIStore` hook acts as the central brain. When a user drags the "Timbral Density" slider in the HUD, the local component updates immediately, but it only writes to the global store via a debounced function to prevent thrashing.
        
    3. **Canvas Subscription:** The WebGL camera component subscribes directly to the `useUIStore`'s target coordinates. When the UI updates the target, the camera smoothly pans to the new location.
        
    4. **API Communication:** The UI Overlays handle all HTTP/WebSocket traffic. When the Semantic Command Line fires, it awaits the backend response, updates the HUD sliders to match the newly calculated NLP weights, and updates the global target coordinate.
        

**3) Tech Stack & Libraries**

- **Language:** TypeScript (Strict Mode).
    
- **UI Framework:** React 18+.
    
- **State Management:** `zustand` (Chosen specifically because it allows components to subscribe to state slices without triggering app-wide React Context re-renders).
    
- **Styling:** Tailwind CSS (for rapid layout, z-index management, and `backdrop-blur` utilities).
    
- **Network Client:** `axios` or native `fetch` (for REST), native `WebSocket` API (for real-time HUD adjustments).
    

**4) Inputs (Ingress)**

- **Source:** User Interaction (DOM Events) & API Gateway Responses.
    
- **Payload Schema (TypeScript Interface - API Response to Semantic Query):**
    
    TypeScript
    
    ```
    interface SemanticTranslationResponse {
      interpreted_parameters: {
        timbral_density_h0: number;
        cyclic_frequency_h1: number;
        transient_sharpness: number;
      };
      target_vector: number[]; // 1500d array
    }
    ```
    

**5) Outputs (Egress)**

- **Destination:** API Gateway (via HTTP/WSS) & Global UI Store.
    
- **Output Payload Schema (JSON Contract - Streaming HUD Adjustments):**
    
    JSON
    
    ```
    {
      "action": "geodesic_shift",
      "deltas": {
        "timbral_density_h0": 0.05,
        "cyclic_frequency_h1": -0.02
      },
      "current_umap_coords": [14.2, -5.1]
    }
    ```
    

**6) Failure States**

- **API Timeout (Semantic Search):** The user hits enter on the command line, but the API takes longer than 3 seconds or fails. _Recovery:_ The input box glows red, text reverts to a monospace error `[ERR: TRANSLATION TIMEOUT]`, and resets after 2 seconds. The camera does not move.
    
- **WebSocket Disconnect:** The real-time connection for the HUD drops. _Recovery:_ The HUD sliders instantly become visually disabled (opacity 50%, un-draggable) and a "Reconnecting to Node..." status indicator appears to prevent the user from sending geodesic shifts into the void.
    
- **Rate Limiting (HTTP 429):** The user spams the search bar. _Recovery:_ The UI catches the 429 response, locks the input field, and displays a cooldown timer (`[THROTTLE: 3s]`).
    

**7) Performance Constraints**

- **Render Isolation (The Golden Rule):** Typing a single character into the Semantic Command Line or dragging a slider MUST NOT trigger a re-render of the parent `<App>` component or the `<Canvas>` component.
    
- **Debouncing:** Rapid slider movements must update the local DOM at 60fps but must be debounced to **$\approx 100 \text{ms}$** before firing WebSocket payloads to prevent overwhelming the API Gateway.
    
- **Bundle Size:** UI logic must remain lightweight. Heavy libraries (like large charting libraries or complex form handlers) should be avoided to ensure the client loads instantly.
    

**8) Validation Strategy**

- **Render Profiling:** Use the React DevTools Profiler. Record a session where a user drags the HUD sliders wildly for 10 seconds. Assert that the WebGL Canvas component registers exactly **0 renders** during this DOM interaction.
    
- **Debounce Testing:** Write a unit test using `vitest` and `jest.useFakeTimers()`. Simulate 50 slider `onChange` events within 50 milliseconds. Assert that the mock WebSocket `send()` function is only called exactly once after the debounce threshold is met.
    
- **Visual Regression Testing:** Use a tool like Cypress or Playwright to ensure that the `z-index` layering never breaks (e.g., ensuring the canvas never accidentally overlaps the HUD on weird screen aspect ratios or mobile breakpoints).