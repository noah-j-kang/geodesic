### **Sub-Project: HNSW Vector Node**

**1) Description**

The HNSW Vector Node is the spatial mapping engine and the central nervous system of the TopoAcoustic Discovery Engine's real-time capabilities. While standard relational databases are excellent at storing text and managing user credentials, they are fundamentally incapable of executing sub-millisecond similarity searches across tens of thousands of high-dimensional (1500-d) mathematical spaces.

This module circumvents that bottleneck by holding the entire known acoustic universe in active RAM using a Hierarchical Navigable Small World (HNSW) graph. It is responsible for powering the UI's "Geodesic Transit," instantly calculating the nearest topological neighbors (music tracks) to a user's current spatial coordinate or to a newly generated semantic search vector.

**2) Architecture & Logic**

- **Pattern:** Stateful Singleton Service (Microservice).
    
- **Pipeline Logic:**
    
    1. **Cold-Start Rehydration:** Upon container boot, the node loads the latest graph snapshot (`index_snapshot.bin`) and its corresponding ID dictionary (`id_map.json`) from a persistent volume into active RAM.
        
    2. **Ingestion (Write Path):** Receives new 1500-dimensional vectors from the ETL Pipeline. It generates an auto-incrementing integer ID (required by HNSW), updates the Bi-directional Hash Map (`Integer <-> Spotify ID`), and inserts the vector into the live graph.
        
    3. **Querying (Read Path):** Receives a target vector and a `k` limit from the API Gateway. It executes a high-speed `knn_query` against the graph, retrieving the nearest integer IDs and their mathematical distances. It then translates those integers back into `spotify_track_id` strings using the Hash Map.
        
    4. **Persistence (Snapshotting):** A cron-triggered background thread temporarily pauses writes (allowing reads to continue) to serialize the RAM graph and the ID dictionary to disk, ensuring data survival in the event of a container crash.
        

**3) Tech Stack & Libraries**

- **Language:** Python 3.10+
    
- **Vector Search Engine:** `hnswlib` (Python bindings over the highly optimized C++ header-only library).
    
- **Data Handling:** `numpy` (Strictly Float32 precision for memory efficiency).
    
- **Service Framework:** FastAPI or gRPC (Exposed purely as an internal microservice, not public-facing).
    

**4) Inputs (Ingress)**

- **Source (Querying):** Internal API Gateway or Semantic Router.
    
- **Source (Ingestion):** Internal message queue triggered by the ETL Pipeline.
    
- **Query Payload Schema (JSON Contract):**
    
    JSON
    
    ```
    {
      "target_vector": [0.012, 0.443, 0.991, ...], 
      "k": 20
    }
    ```
    
- **Ingestion Payload Schema (JSON Contract):**
    
    JSON
    
    ```
    {
      "spotify_track_id": "3n3PpDZ7sJ...",
      "topological_signature": [0.012, 0.443, 0.991, ...]
    }
    ```
    

**5) Outputs (Egress)**

- **Destination:** Internal API Gateway (to be enriched with PostgreSQL metadata).
    
- **Output Payload Schema (JSON Contract):**
    
    JSON
    
    ```
    {
      "query_time_ms": 2.4,
      "results": [
        {
          "spotify_track_id": "3n3PpDZ7sJ...",
          "distance_l2": 0.042
        },
        {
          "spotify_track_id": "5x8QwPL9tK...",
          "distance_l2": 0.051
        }
      ]
    }
    ```
    

**6) Failure States**

- **Out of Memory (OOM):** If the dataset outgrows the allocated container RAM, the OS will kill the process. _Recovery:_ The container orchestrator restarts the service, which boots from the last stable snapshot. DevOps is alerted to vertically scale RAM.
    
- **Disk/Snapshot Failure:** If the persistent volume fills up, the cron snapshot fails. _Recovery:_ Catch `IOError`, skip the snapshot, log a critical alert, but **keep the read-replica alive** in RAM to serve active user traffic until the storage issue is resolved.
    
- **Corrupted Snapshot on Boot:** If the container restarts and `index_snapshot.bin` is unreadable. _Recovery:_ Fallback to a secondary Cloud Object Storage backup (e.g., AWS S3). If that fails, trigger an emergency full-rebuild script that re-fetches all vectors from the raw data lake.
    

**7) Performance Constraints**

- **Read Latency:** The `knn_query` operation must complete in **< 10 milliseconds** for $k=20$, supporting high UI frame rates.
    
- **Write Latency:** Inserting a single new node into the graph must not block the main thread for more than **50 milliseconds**.
    
- **Memory Constraints:** 1500 dimensions $\times$ 4 bytes $\times$ 50,000 tracks $\approx$ ~300 MB of raw vector data. With graph overhead, the container must be allocated a minimum of **1 GB of RAM** and meticulously monitored.
    
- **Concurrency:** The node must support thread-safe read operations to handle dozens of simultaneous users scrubbing their Geodesic UI sliders.
    

**8) Validation Strategy**

- **Mathematical Precision Testing:** Initialize an empty index. Insert vector $A$. Insert vector $B$ (which is exactly vector $A$ + $0.1$ on one axis). Query the index using vector $A$. Assert that vector $B$ is returned with the exact, mathematically predicted L2 distance.
    
- **Cold-Start Resilience Testing:** Write a test script that inserts 100 vectors, forces a `.save_index()` command, and kills the Python process. Spin up a new process, force a `.load_index()`, and query it. Assert that the Bi-directional Hash Map successfully mapped the integer IDs back to the original `spotify_track_id` strings without misalignment.