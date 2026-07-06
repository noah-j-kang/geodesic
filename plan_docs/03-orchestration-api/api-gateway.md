### **Sub-Project: API Gateway**

**1) Description**

The API Gateway is the stateless, highly concurrent "Traffic Cop" and Orchestrator for the entire TopoAcoustic Discovery Engine. It serves as the exclusive entry point for all client-side network traffic originating from the React/WebGL frontend. It intentionally performs zero mathematical computation and holds no local database state; instead, it acts as a secure, high-speed routing layer.

Its primary purpose is to insulate the fragile, computationally heavy internal microservices (like the HNSW Vector Node) from the chaotic public web. It enforces strict data validation contracts, verifies user authentication (JWTs), and executes "scatter-gather" operations. When a user requests a recommendation, the Gateway simultaneously queries the internal vector index for math and the PostgreSQL database for text, stitching the disparate data structures into a single, unified, front-end-friendly payload.

**2) Architecture & Logic**

- **Pattern:** Backend-For-Frontend (BFF) / API Gateway / Scatter-Gather.
    
- **Pipeline Logic:**
    
    1. **Ingress & Auth:** Intercepts HTTP/WSS requests and immediately checks the `Authorization: Bearer` header, validating the cryptographic signature of the Supabase JWT.
        
    2. **Strict Validation:** Passes the raw request body through a strict Pydantic v2 schema. Malformed data is instantly rejected before any internal routing occurs.
        
    3. **The Scatter (Fan-Out):** Asynchronously dispatches requests to the required internal services via HTTP/gRPC. For a vector query, it pings the HNSW Node (Workstream 2) passing the target vector.
        
    4. **The Gather:** Receives the nearest-neighbor integer/Spotify IDs from the HNSW Node. It then fires an async SQL query (via connection pool) to the Relational Database (Supabase) to fetch the human-readable metadata for those exact IDs.
        
    5. **Merge & Egress:** Zips the mathematical distances and the track metadata together into a unified JSON structure and returns it to the client.
        
    6. **WebSocket Management:** Maintains persistent WSS channels for real-time Geodesic HUD updates, streaming coordinate shifts continuously without HTTP handshake overhead.
        

**3) Tech Stack & Libraries**

- **Language:** Python 3.10+
    
- **Web Framework:** `FastAPI` (for native asynchronous I/O and auto-generated OpenAPI documentation).
    
- **ASGI Server:** `uvicorn` (to manage concurrent worker processes).
    
- **Data Validation:** `pydantic` (v2, strictly enforced).
    
- **Network Clients:** `httpx` (for async internal microservice calls) and `supabase-py` (for Auth and DB connection).
    

**4) Inputs (Ingress)**

- **Source:** The React/WebGL Client application.
    
- **Payload Schema (JSON Contract - Example: Vector Recommend Route):**
    
    JSON
    
    ```
    {
      "target_vector": [0.012, 0.443, 0.991, ...], 
      "limit": 20,
      "user_coordinates": {
        "umap_x": -14.2,
        "umap_y": 8.1
      }
    }
    ```
    

**5) Outputs (Egress)**

- **Destination:** The React/WebGL Client application.
    
- **Output Payload Schema (JSON Contract - Example: Unified Response):**
    
    JSON
    
    ```
    {
      "query_latency_ms": 65,
      "results": [
        {
          "spotify_track_id": "3n3PpDZ7sJ...",
          "distance_l2": 0.042,
          "metadata": {
            "artist_name": "Artist Name",
            "track_title": "Track Title",
            "preview_url": "https://p.scdn.co/mp3-preview/...",
            "album_art_url": "https://i.scdn.co/image/..."
          }
        }
      ]
    }
    ```
    

**6) Failure States**

- **Malformed Request (Bad Data):** The client sends a vector array with 1499 dimensions instead of 1500, or a string instead of a float. _Recovery:_ Pydantic automatically catches this, short-circuits the pipeline, and returns a `422 Unprocessable Entity` detailing the exact schema violation.
    
- **Internal Microservice Timeout:** The HNSW Node or Supabase DB hangs and fails to respond within 50ms. _Recovery:_ The Gateway wraps internal `httpx` calls in strict timeouts. It catches `httpx.TimeoutException`, logs a critical internal error, and returns a graceful `503 Service Unavailable` to the client.
    
- **Invalid/Expired Authentication:** A user's session token expires. _Recovery:_ The dependency injection layer fails the JWT validation and instantly returns a `401 Unauthorized`, triggering the frontend to route the user back to the login page.
    
- **Traffic Spikes / DDoS:** _Recovery:_ The Gateway utilizes a Redis-backed rate limiter (e.g., token bucket algorithm). If a user exceeds $X$ requests per second, it intercepts the request and returns `429 Too Many Requests`.
    

**7) Performance Constraints**

- **Gateway Latency Overhead:** The Gateway itself must add no more than **15 to 20 milliseconds** of processing time. (Total round-trip time, including internal DB calls, should remain $< 100ms$).
    
- **Memory Limits:** Because it is entirely stateless, a single Uvicorn worker process should consume very little RAM (**~150MB**). This allows for massive horizontal scaling (spinning up dozens of instances behind a load balancer).
    
- **Concurrency:** The async event loop must comfortably handle hundreds of simultaneous open WebSocket connections and standard HTTP requests per worker without thread-blocking.
    

**8) Validation Strategy**

- **Unit Testing (Mocking):** Use `pytest` and `httpx.AsyncClient` or `TestClient`. Mock the responses of the HNSW Node and Supabase database. Send a valid payload to the Gateway test endpoint and assert that it correctly zips the mocked data together into the unified egress schema.
    
- **Schema Fuzzing:** Programmatically bombard the Gateway's endpoints with incorrectly typed data, missing fields, and massive string payloads. Assert that 100% of these requests yield a `422 Unprocessable Entity` or `413 Payload Too Large` without crashing the Uvicorn worker.
    
- **Load Testing:** Use `k6` or `Locust` to simulate 500 concurrent users hitting the recommendation endpoint. Assert that the 95th percentile latency (p95) remains under the 100ms budget and that zero memory leaks occur over a 15-minute sustained test.