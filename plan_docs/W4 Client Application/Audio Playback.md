### **Sub-Project: Audio Playback**

**1) Description**

The Audio Playback module (visually represented as the "Active Node Inspector" in the bottom-left of the UI) is the sensory anchor of the TopoAcoustic Discovery Engine. While the WebGL canvas allows users to navigate abstract mathematical geometry, this component translates that abstract space back into human-perceptible sound.

Sticking to the "Cartographer of the Void" design philosophy, this module aggressively strips away traditional commercial music player tropes. It desaturates album artwork and prioritizes the display of mathematical proximity (e.g., $W_p$ Distance: 0.042) over artist popularity. Its primary mechanical function is to seamlessly stream 30-second `.mp3` previews as the user jumps between nodes, providing immediate acoustic validation of the topological search engine.

**2) Architecture & Logic**

- **Pattern:** Singleton Audio Controller / Observer Pattern (via Zustand).
    
- **Pipeline Logic:**
    
    1. **Global State Subscription:** The Audio component mounts once and subscribes to a global `useUIStore` (Zustand). It listens specifically for changes to an `active_node` state, which is updated whenever a user clicks or auto-targets a node in the WebGL canvas.
        
    2. **Teardown & Initialization:** When `active_node` changes, the component immediately pauses any currently playing audio, clears the existing HTML5 `Audio` object buffer, and initializes a new stream using the node's `preview_url`.
        
    3. **Buffered Streaming:** It relies on the browser's native Web Audio API to stream the audio chunk-by-chunk directly from the CDN, preventing the need to download the full 30-second file before playback begins.
        
    4. **Render Loop Detachment:** The current playback time (`currentTime`) is tracked using a localized `requestAnimationFrame` loop or a deeply nested atomic component to animate the waveform scrubber. This ensures that the audio progress bar rendering does _not_ trigger global React re-renders that would crash the WebGL canvas framerate.
        

**3) Tech Stack & Libraries**

- **Language:** TypeScript (Strict Mode).
    
- **UI Framework:** React 18+.
    
- **State Management:** `zustand` (for cross-component state without React Context re-render penalties).
    
- **Audio Engine:** Native HTML5 `<audio>` element and Web Audio API.
    
- **Styling:** Tailwind CSS (for the frosted-glass overlays and scrubber animations).
    

**4) Inputs (Ingress)**

- **Source:** Global UI Store (populated by user interaction with the WebGL canvas).
    
- **Payload Schema (TypeScript Interface):**
    
    TypeScript
    
    ```
    interface ActiveNodeData {
      spotify_track_id: string;
      distance_l2: number; // The mathematical proximity to the user's center
      metadata: {
        artist_name: string;
        track_title: string;
        preview_url: string; // The vital audio stream link
        album_art_url: string;
      };
      autoplay: boolean; // Flag indicating if the user explicitly clicked the node
    }
    ```
    

**5) Outputs (Egress)**

- **Destination:** The User's Speakers & The Local DOM (Scrubber UI).
    
- **Output Payload Schema (Internal UI State):**
    
    TypeScript
    
    ```
    interface AudioPlayerState {
      isPlaying: boolean;
      duration: number; // Typically 30.0
      currentTime: number;
      bufferedRanges: [number, number][];
      errorStatus: "NONE" | "DEAD_LINK" | "AUTOPLAY_BLOCKED";
    }
    ```
    

**6) Failure States**

- **Dead Preview URL (HTTP 404):** Occasionally, Spotify removes preview links. If the `<audio>` element throws an `onerror` event, the UI catches it, disables the play button, and displays a subtle matrix-green monospace text: `[ERR: AUDIO STREAM UNAVAILABLE]`.
    
- **Browser Autoplay Blocked:** Modern browsers block audio from playing without prior user interaction. If `audio.play()` returns a rejected Promise (`NotAllowedError`), the component catches it, pauses the UI state, and pulses the Play button to prompt a manual user click.
    
- **Network Stutter / Buffer Underrun:** If the user's connection drops, the `onwaiting` event fires. The play icon swaps to a minimalist loading spinner until the `oncanplay` event fires again.
    

**7) Performance Constraints**

- **Memory Limits:** The browser must garbage-collect the audio buffer immediately upon switching nodes. A maximum of ONE `HTMLAudioElement` should exist in the DOM memory at any time (Singleton pattern).
    
- **Render Bottlenecks:** The progress scrubber must update at $\ge 30 \text{ fps}$ without causing the parent container to re-render. If React state proves too slow, the scrubber width must be manipulated via direct DOM ref mutations (`ref.current.style.width`).
    
- **Latency:** Audio playback must initiate within **< 200 milliseconds** of the user clicking a node in the WebGL canvas.
    

**8) Validation Strategy**

- **DOM Testing:** Use `React Testing Library` and `vitest`. Mock the HTML5 `Audio` constructor. Simulate an `active_node` state change and assert that `audio.pause()` is called on the old instance and `audio.play()` is called on the new instance.
    
- **Autoplay Exception Handling:** Write a specific test where the mocked `audio.play()` function returns a rejected Promise. Assert that the component's internal state correctly flips to `isPlaying: false` and the UI updates to show the manual Play icon rather than crashing the component tree.
    
- **Memory Leak Auditing:** Run a local session and rapidly click through 50 different WebGL nodes. Monitor Chrome DevTools Performance tab to ensure the number of native DOM Audio nodes does not incrementally increase.