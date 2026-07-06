### **Sub-Project: Relational States**

**1) Description**

The Relational States module serves as the long-term memory and identity manager of the TopoAcoustic Discovery Engine. While the topology engine and vector nodes handle complex, high-dimensional mathematics in volatile RAM, this module provides the rigid, persistent bedrock required for a functional web application. It exclusively stores human-readable track metadata (artist names, track titles, image URLs), secure user profiles, and episodic session logs.

This strict isolation of relational data from mathematical compute is a deliberate architectural choice. By preventing 1500-dimensional vectors from bloating a PostgreSQL database, the system avoids catastrophic `JOIN` bottlenecks. Instead, this module acts as a lightning-fast lookup table, immediately hydrating the raw integer IDs returned by the search infrastructure with the text and images the React frontend needs to render the UI, while simultaneously tracking exactly where users left off in the acoustic manifold.

**2) Architecture & Logic**

- **Pattern:** Cloud-Native RDBMS / Episodic State Snapshotting.
    
- **Pipeline Logic:**
    
    1. **Connection Pooling:** All inbound connections from the asynchronous API Gateway are routed through a PgBouncer pool to prevent connection exhaustion.
        
    2. **Metadata Hydration (Read Path):** The database receives an array of `spotify_track_id` strings. It uses a highly optimized B-Tree index to perform a bulk `SELECT ... WHERE IN` query, instantly fetching the corresponding track metadata.
        
    3. **Episodic State Logging (Write Path):** To prevent database thrashing from constant 60fps UI updates, the React client batches user movement. Every few seconds of "rest", the API Gateway triggers an asynchronous `UPSERT` to the `user_sessions` table, overwriting the user's current UMAP coordinates and target vector.
        
    4. **Row Level Security (RLS):** Every query executed on user-specific tables (`user_sessions`, `geodesic_history`) is cryptographically gated at the database level. The database validates the user's Supabase JWT and ensures they can only read or write rows that strictly match their `user_id`.
        

**3) Tech Stack & Libraries**

- **Database Engine:** PostgreSQL 15+ (Hosted via Supabase).
    
- **Identity Provider (IdP):** Supabase Auth (built on GoTrue).
    
- **Connection Management:** PgBouncer (native to Supabase architecture).
    
- **Backend Client:** `supabase-py` (Python client utilized by the FastAPI Gateway).
    

**4) Inputs (Ingress)**

- **Source:** API Gateway (acting on behalf of the user).
    
- **Payload Schema (JSON Contract - Example: Hydration Request):**
    
    JSON
    
    ```
    {
      "query_type": "metadata_fetch",
      "spotify_track_ids": [
        "3n3PpDZ7sJ...",
        "5x8QwPL9tK...",
        "1a2BcDE3fG..."
      ]
    }
    ```
    
- **Payload Schema (JSON Contract - Example: Session UPSERT):**
    
    JSON
    
    ```
    {
      "query_type": "session_update",
      "user_id": "a1b2c3d4-e5f6...",
      "session_state": {
        "umap_x": -14.25,
        "umap_y": 8.11,
        "current_target_vector": [0.012, 0.443, ...]
      }
    }
    ```
    

**5) Outputs (Egress)**

- **Destination:** API Gateway.
    
- **Output Payload Schema (JSON Contract - Example: Hydration Response):**
    
    JSON
    
    ```
    [
      {
        "spotify_track_id": "3n3PpDZ7sJ...",
        "artist_name": "Artist Name",
        "track_title": "Track Title",
        "preview_url": "https://p.scdn.co/mp3-preview/...",
        "album_art_url": "https://i.scdn.co/image/..."
      }
    ]
    ```
    

**6) Failure States**

- **Connection Exhaustion:** If the FastAPI worker pool scales up and attempts to open too many direct database connections, PostgreSQL will lock up. _Recovery:_ The system strictly enforces routing through the PgBouncer pool. If the pool queue is full, it returns a fast `503 Service Unavailable` rather than crashing the database instance.
    
- **Missing Metadata (Cache Miss):** The HNSW node returns a track ID that does not exist in the `tracks` table (due to an ingestion sync error). _Recovery:_ The SQL query uses `COALESCE` or the Gateway catches the missing row and gracefully omits that specific track from the UI response, flagging DevOps for a sync check.
    
- **RLS Violation (Unauthorized Access):** A malicious actor attempts an API call to overwrite another user's session coordinates. _Recovery:_ Supabase RLS policies block the `UPSERT` at the kernel level. The database returns a `401 Unauthorized` or silently updates 0 rows, and the Gateway logs a severe security alert.
    

**7) Performance Constraints**

- **Read Latency:** Metadata hydration queries (`SELECT ... IN (...)`) must execute in **< 15 milliseconds** leveraging B-Tree indexes on the `spotify_track_id` column.
    
- **Write Latency:** Episodic session `UPSERT` operations must complete in **< 25 milliseconds** to free up the connection pool rapidly.
    
- **Concurrency:** The database must support a minimum of **500 concurrent pooled connections** without significant query degradation.
    

**8) Validation Strategy**

- **Index & Query Plan Validation:** Use `EXPLAIN ANALYZE` on the primary metadata fetch query. Assert that the database is executing an "Index Scan" or "Bitmap Heap Scan" and explicitly NOT performing a "Sequential Scan". A sequential scan on 50,000+ tracks will immediately fail the latency budget.
    
- **RLS Security Testing:** Create two mock users (User A and User B) with valid JWTs in a staging environment. Execute an automated test where User A's token attempts to run an `UPDATE` on User B's `user_sessions` row. Assert that the operation is completely blocked and throws a permission error.
    
- **Pooler Stress Test:** Simulate 2,000 simultaneous session update requests from the API Gateway. Assert that PgBouncer successfully queues and resolves the transactions without dropping connections or triggering a database panic.