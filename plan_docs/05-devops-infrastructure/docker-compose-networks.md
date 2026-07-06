### **Sub-Project: Docker Compose Networks**

**1) Description**

The Docker Compose Networks module serves as the localized orchestration layer for the TopoAcoustic Discovery Engine. While Terraform handles the massive cloud infrastructure for production, Docker Compose provides the vital "infrastructure-in-a-box" for local development and Continuous Integration testing. It defines exactly how the disparate microservices—the React frontend, the FastAPI gateway, the Python ETL workers, the C++ HNSW graph, and the Redis broker—boot up, communicate, and share data on a single machine.

This sub-project exists to completely eradicate the "it works on my machine" syndrome. By strictly defining container boundaries, internal bridge networks, environment variables, and persistent volumes in a single declarative YAML file, any developer can clone the repository and spin up a perfect replica of the production ecosystem in under two minutes with a single terminal command.

**2) Architecture & Logic**

- **Pattern:** Local Multi-Container Orchestration / Internal Bridge Networking.
    
- **Pipeline Logic:**
    
    1. **Network Segmentation:** Creates distinct, isolated virtual networks (e.g., `frontend-tier`, `backend-tier`, `data-tier`). The React container cannot speak directly to the PostgreSQL database; it must pass through the API Gateway, exactly mirroring production VPC rules.
        
    2. **Volume Mounting (State & Code):** Maps local host directories to container paths (Bind Mounts) for instantaneous hot-reloading during development. Maps ephemeral named volumes to the HNSW and PostgreSQL containers to ensure databases survive container restarts.
        
    3. **Boot Sequencing:** Uses strict `depends_on` conditions linked to `healthcheck` probes. The API Gateway container will physically refuse to start until the Redis broker and Supabase emulator containers report a "healthy" status.
        
    4. **Resource Allocation:** Enforces strict memory and CPU limits on the local containers to mimic production constraints, preventing the heavy TDA math engines from accidentally locking up the developer's laptop.
        

**3) Tech Stack & Libraries**

- **Orchestration Engine:** Docker Desktop / Docker Engine.
    
- **Definition Standard:** Docker Compose specification (v2/v3 YAML format).
    
- **Environment Management:** `.env` files (injected at runtime, strictly ignored by version control).
    
- **Shell Scripting:** Bash/Zsh for wrapper scripts (e.g., `make up`, `make down-clean`).
    

**4) Inputs (Ingress)**

- **Source:** Developer CLI execution (`docker compose up`) and local `.env` files.
    
- **Payload Schema (YAML Contract Snippet):**
    
    YAML
    
    ```
    version: '3.8'
    services:
      api-gateway:
        build: ./backend/api
        ports:
          - "8000:8000"
        environment:
          - REDIS_URL=redis://broker:6379/0
        networks:
          - backend-tier
        depends_on:
          broker:
            condition: service_healthy
    ```
    

**5) Outputs (Egress)**

- **Destination:** The host operating system's Docker Daemon.
    
- **Output Payload Schema (Containerized System State):**
    
    - **Exposed Ports:** `localhost:3000` (Frontend UI), `localhost:8000` (API Gateway Docs).
        
    - **Running Containers:** 5-7 active Linux containers running in isolated namespaces.
        
    - **Persistent Volumes:** Local disk allocation for `hnsw_index_data` and `postgres_data`.
        

**6) Failure States**

- **Port Collisions:** A developer already has a local instance of PostgreSQL running on port 5432, causing the Compose network to crash on boot. _Recovery:_ The `docker-compose.yml` utilizes host-port mapping variables (e.g., `${DB_PORT:-5432}:5432`) allowing developers to quickly remap the host port without altering the committed code.
    
- **Race Conditions (Connection Refused):** The API Gateway boots faster than the database, crashes, and exits. _Recovery:_ The Gateway container is wrapped in a restart policy (`restart: on-failure`) and strictly waits for the DB's `pg_isready` healthcheck before executing its Uvicorn startup script.
    
- **OOM Kills (Exit Code 137):** The local HNSW index or WebGL build consumes all RAM allocated to the Docker Engine. _Recovery:_ The container is terminated by the host OS. The developer is alerted via standard output, and must adjust their Docker Desktop resource limits or utilize a smaller test dataset locally.
    

**7) Performance Constraints**

- **Boot Time:** A cold boot of the entire ecosystem (pulling/building images and establishing networks) should take **< 5 minutes**. Subsequent hot-boots must take **< 30 seconds**.
    
- **Hot-Reload Latency:** Changes made to a React `.tsx` file or FastAPI `.py` file on the host machine must sync across the bind mount and reflect in the running container in **< 2 seconds**.
    
- **Memory Limits:** The `docker-compose.yml` must explicitly define `deploy.resources.limits` to cap the total RAM usage of the stack at **8GB**, ensuring it remains runnable on standard developer hardware.
    

**8) Validation Strategy**

- **Syntax Validation:** Execute `docker compose config` in the CI pipeline before building. This parses the YAML and `.env` files, asserting that the schema is perfectly valid and all variable interpolations are successful.
    
- **Network Isolation Audit:** Spin up the stack. Exec into the `frontend` container shell and attempt to `ping broker` (the Redis container). Assert that the connection times out or is actively refused, proving that the bridge network strictly isolates the frontend from the data tier.
    
- **Automated Integration Smoke Test:** Write a GitHub Action that runs `docker compose up -d --wait`, curls the API Gateway's `/health` endpoint asserting a `200 OK` response, and then executes `docker compose down -v` to ensure the teardown gracefully removes all networks and volumes without hanging.