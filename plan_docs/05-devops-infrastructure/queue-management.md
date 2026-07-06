### **Sub-Project: Queue Management**

**1) Description**

The Queue Management module is the asynchronous circulatory system of the TopoAcoustic Discovery Engine. Because the ETL Pipeline (Workstream 1) involves operations that vary wildly in execution time—from a 200ms API call to a 4-second topological matrix calculation—passing data synchronously between these steps would cause immediate gridlock.

This sub-project implements a robust message broker and distributed task queue infrastructure. It ensures that when the Audio Ingestion worker finishes downloading a file, it can instantly hand off the reference to the next available Feature Extraction worker without waiting. By decoupling the producers from the consumers, this module guarantees fault tolerance; if a Topology Engine worker crashes mid-calculation due to a complex manifold, the queue management system ensures the task is not lost, but rather safely reassigned to another healthy worker.

**2) Architecture & Logic**

- **Pattern:** Distributed Producer-Consumer / Task Queue Architecture.
    
- **Pipeline Logic:**
    
    1. **Topic Segregation:** The broker maintains strictly isolated logical queues: `ingestion_tasks`, `dsp_tasks`, and `topology_tasks`.
        
    2. **Publishing (Producer):** When a module completes its work, it acts as a producer, serializing the resulting data footprint (or file path) into a lightweight message and publishing it to the tail of the next respective queue.
        
    3. **Polling & Locking (Consumer):** Idle worker containers continually poll their assigned queues. When a message is retrieved, the broker places a temporary lock (unacknowledged status) on that message so no other worker picks it up.
        
    4. **Acknowledgment (ACK):** Once the worker successfully completes the computation, it sends an `ACK` back to the broker, which definitively deletes the message from the queue.
        
    5. **Dead Letter Routing:** If a task fails repeatedly (e.g., exceeding 3 retries due to corrupted audio), it is routed to a `dead_letter_queue` (DLQ) for manual inspection, preventing "poison pills" from infinitely crashing workers.
        

**3) Tech Stack & Libraries**

- **Message Broker:** Redis (In-memory data structure store) or RabbitMQ. _(Redis is often preferred for TopoAcoustic to double as a rate-limiting cache for the API Gateway)._
    
- **Task Orchestration (Python):** `Celery` (Enterprise-grade asynchronous task queue system).
    
- **Monitoring & Dashboard:** `Flower` (Real-time web-based monitor for Celery clusters).
    
- **Serialization:** `JSON` or `msgpack` (for more compact binary payloads between workers).
    

**4) Inputs (Ingress)**

- **Source:** Any producer module (Ingestion, Extraction, Topology) pushing a new task.
    
- **Payload Schema (Standardized Celery Task Envelope):**
    
    JSON
    
    ```
    {
      "task": "etl.tasks.run_feature_extraction",
      "id": "c5a6b7c8-d9e0...",
      "args": [
        "3n3PpDZ7sJ...", 
        "/tmp/audio_3n3PpDZ7sJ.mp3"
      ],
      "kwargs": {},
      "retries": 0,
      "eta": null
    }
    ```
    

**5) Outputs (Egress)**

- **Destination:** The designated Consumer worker, and ultimately the Task Result Backend (if task states need to be queried).
    
- **Output Payload Schema (Task State Update):**
    
    JSON
    
    ```
    {
      "task_id": "c5a6b7c8-d9e0...",
      "status": "SUCCESS",
      "result": {
        "next_queue": "topology_tasks",
        "payload_dispatched": true
      },
      "traceback": null
    }
    ```
    

**6) Failure States**

- **Worker Death (Hardware Failure / OOM):** A Topology worker consumes too much RAM and is killed by the OS before sending an `ACK`. _Recovery:_ The broker's visibility timeout expires. The broker assumes the worker died, removes the lock, and automatically requeues the message for the next available worker.
    
- **Broker Memory Exhaustion:** The ingestion script pulls tracks faster than the math engines can process them, filling up Redis RAM. _Recovery:_ Redis must be configured with a strict `maxmemory` limit and an eviction policy (e.g., `noeviction` for strict queues, forcing producers to pause, or offloading to disk). The auto-scaler should concurrently spin up more consumer workers.
    
- **Poison Pill Task:** A specific track's audio causes an uncatchable C++ segmentation fault in the `gudhi` library every time it runs. _Recovery:_ Celery tracks the retry count. After 3 failed attempts, the task is stripped from the main queue and pushed to the `dead_letter_queue`, triggering an alert for the developer to inspect that specific Spotify ID.
    

**7) Performance Constraints**

- **Throughput:** The broker must be capable of handling a minimum of **1,000 messages per second** without noticeable latency degradation.
    
- **Payload Size:** Message queues are not databases. Payloads must remain under **1 MB**. Raw audio `.mp3` files or massive numpy arrays must NEVER be sent through the queue; the queue must only pass the _local file path_ or _S3 URI_ pointing to the data.
    
- **Latency:** The round-trip time for a worker to pull a task and register an active lock must be **< 10 milliseconds**.
    

**8) Validation Strategy**

- **Chaos Engineering (Kill Test):** Write an automated integration test that submits 10 DSP tasks to the queue. While the workers are processing, use a script to aggressively `kill -9` a random worker process. Assert that the overall pipeline still completes all 10 tasks successfully, proving the broker correctly identified the orphaned lock and requeued the interrupted task.
    
- **DLQ Routing Verification:** Submit a mock task specifically engineered to throw a `ValueError`. Assert that the worker attempts the task exactly 3 times (or the configured retry limit) and then successfully routes the task ID and traceback into the Dead Letter Queue without stalling the rest of the queue.
    
- **Monitoring Audit:** Boot the `Flower` dashboard container. Flood the broker with 5,000 dummy messages. Assert that the dashboard correctly tracks the queue backlog in real-time, accurately reflecting active, queued, and succeeded task states.