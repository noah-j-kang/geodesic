# Autonomous Agent Playbook (AGY + Jules)

This document outlines the standard operating procedure for building the TopoAcoustic Discovery Engine using a dual-agent strategy: **Antigravity CLI (AGY)** for local orchestration, and **Google Jules** for asynchronous cloud-based backend engineering.

## 1. The Division of Labor

| Agent | Environment | Best For... | Avoid Using For... |
| :--- | :--- | :--- | :--- |
| **AGY CLI** (`agy`) | Local Machine | Repository scaffolding, Docker Compose setup, Terraform scripts, WebGL / Three.js iterative debugging. | Heavy backend implementations, long-running TDD loops. |
| **Jules CLI** (`jules`) | Cloud VM / GitHub | Python ETL workers, TDA math engines, FastAPI routing, writing `pytest` suites. | Visual frontend tuning, executing local bash scripts. |

## 2. Execution Playbook (The Build Order)

### Phase 1: Infrastructure & Scaffolding (AGY Local)
**Goal:** Create the repo structure and local Docker environment so Jules has a place to commit code.
1. Run AGY in the root directory.
2. **Prompt:** *"Read `/plan_docs/00_architecture.md` and scaffold the entire directory structure for the TopoAcoustic project."*
3. **Prompt:** *"Read `/plan_docs/W5 DevOps & Infrastructure`. Generate the master `docker-compose.yml` for local development. Include a Redis broker, an empty FastAPI container, and placeholders for ETL workers."*
4. Commit and push to GitHub.

### Phase 2: The Core Math & Data Engines (Jules Cloud)
**Goal:** Delegate the heavy, isolated Python workstreams to Jules.
1. **Workstream 1 (ETL):** * `jules remote new --session "Read /plan_docs/W1 ETL Pipeline. Implement the Audio Ingestion and Feature Extraction Celery workers in Python. Use librosa for DSP. Write pytest unit tests."`
2. **Workstream 2 (Search):** * `jules remote new --session "Read /plan_docs/W2 Vector Search Infrastructure. Build the HNSW Vector Node microservice using hnswlib. Implement the Semantic Router NLP logic. Include tests."`
*(Note: You can run these Jules commands with the `--parallel` flag so they execute concurrently).*

### Phase 3: The API Bridge (Jules Cloud)
**Goal:** Connect the Math to the UI.
1. **Workstream 3 (Orchestration):**
   * `jules remote new --session "Read /plan_docs/W3 Orchestration & State API. Build the FastAPI gateway. Implement the scatter-gather endpoints that query the HNSW Node and Supabase. Enforce strict Pydantic v2 schemas."`

### Phase 4: WebGL & UI Development (AGY Local)
**Goal:** Build the interactive interface. Because WebGL requires visual feedback and browser rendering, this MUST be done locally with AGY.
1. **Pull Backend Code:** `jules remote pull --session <ID>`
2. **Start Local Backend:** `docker compose up --build`
3. **Build Frontend with AGY:** Use AGY iteratively to build out the React application. 
   * **Prompt:** *"Read `/plan_docs/W4 Client Application`. Scaffold the React+Vite app. Set up the Zustand store for the UI Overlays and build the Three.js InstancedMesh canvas."*

## 3. Agentic Workflow Rules
* **Context Priming:** Always explicitly tell the agent *which* document to read (e.g., "Read `plan_docs/W1 ETL Pipeline/Topology Engine.md`"). Do not assume they have all 15 documents perfectly indexed in their active context window simultaneously.
* **Review PRs Carefully:** Jules will open Pull Requests. Because the math in Workstream 1 (TDA, Takens' Theorem) is complex, thoroughly review the PR logic before merging into `main` and pulling to your local environment.