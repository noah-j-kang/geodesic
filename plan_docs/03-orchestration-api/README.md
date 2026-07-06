### **Workstream 3: Orchestration & State API**

**1) Description of the Workstream**

The Orchestration & State API is the central nervous system and primary traffic controller of the TopoAcoustic Discovery Engine. While the ETL Pipeline (Workstream 1) and Vector Search Infrastructure (Workstream 2) handle the heavy lifting of audio mathematics and high-dimensional querying, this workstream is intentionally designed to do zero mathematical computation. It acts as the stateless, highly concurrent "Backend-For-Frontend" (BFF).

Its sole purpose is to intercept incoming requests from the React/WebGL client, validate user authentication, enforce strict data contracts, and orchestrate complex "scatter-gather" operations. For example, when a user searches for a track, this API simultaneously queries the RAM-based HNSW index for spatial distances and the PostgreSQL database for human-readable metadata (titles, album art), stitching them together into a single, unified response. It is the protective boundary that ensures the core mathematical engines are never exposed directly to the public web.

**2) Definition of Done (DoD) / Key Deliverables**

To consider Workstream 3 complete and ready for integration, the following conditions must be met and verifiable:

- **Authentication & IAM Integration:** The FastAPI gateway successfully intercepts HTTP requests, extracts Supabase JWTs from the `Authorization: Bearer` header, cryptographically validates them, and successfully blocks unauthenticated traffic.
    
- **Scatter-Gather Execution:** The API can receive a query, ping the HNSW Vector Node microservice to retrieve nearest-neighbor integer IDs, query the Supabase PostgreSQL `tracks` table to retrieve matching metadata, zip the two datasets together, and return a unified JSON payload to the frontend.
    
- **Continuous State Logging:** A background or asynchronous route successfully receives coordinate updates (`umap_x`, `umap_y`, and `target_vector`) from the frontend and performs an `UPSERT` to the `user_sessions` table to log the user's trajectory without bottlenecking other requests.
    
- **Session Rehydration:** Upon a user logging in, the API successfully queries their last known state from the `user_sessions` table and serves it to the frontend, allowing the WebGL canvas to initialize exactly where the user left off.
    
- **Real-Time WebSocket Channel:** A stable WSS (WebSocket Secure) connection is established that allows the UI to stream high-frequency Geodesic HUD micro-adjustments without the overhead of standard HTTP headers.
    
- **Strict Boundary Validation:** All incoming requests and outgoing responses are strictly typed and validated using Pydantic v2 schemas. Malformed payloads must automatically trigger a `422 Unprocessable Entity` error before touching any internal database or search node.
    
- **Latency Overhead Compliance:** The API Gateway itself must add no more than **15 milliseconds** of processing overhead to any given request (excluding the actual execution time of the downstream databases).