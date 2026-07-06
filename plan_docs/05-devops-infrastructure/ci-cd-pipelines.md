### **Sub-Project: CI/CD Pipelines**

**1) Description**

The CI/CD (Continuous Integration / Continuous Deployment) Pipelines form the automated quality assurance and delivery mechanism of the TopoAcoustic Discovery Engine. Because this project utilizes a highly decoupled microservice architecture—spanning heavy Python mathematical compute (TDA), C++ wrapped in-memory graphs (HNSW), and high-performance WebGL React frontends—manual testing and deployment are highly prone to human error.

This sub-project exists to ensure that every single code commit is automatically verified before it reaches production. It guarantees that a change to the UI does not accidentally break the topological math engines, that all Docker containers build successfully, and that secure secrets (like Spotify API keys or Supabase JWTs) are correctly injected into the production environment without ever being hardcoded in the repository.

**2) Architecture & Logic**

- **Pattern:** Event-Driven Pipeline / Multi-Stage Build & Deploy.
    
- **Pipeline Logic:**
    
    1. **Trigger:** A developer opens a Pull Request (PR) or pushes directly to the `main` branch.
        
    2. **Stage 1 - Linting & Static Analysis:** The pipeline runs `Ruff` (for Python) and `ESLint` (for TypeScript) to enforce strict code quality and catch type errors early.
        
    3. **Stage 2 - Unit & Integration Testing:** * Spins up an ephemeral test matrix.
        
        - Runs `pytest` on the ETL Pipeline and API Gateway (validating the math and endpoints).
            
        - Runs `vitest` on the React frontend.
            
    4. **Stage 3 - Containerization:** If all tests pass, the pipeline builds independent Docker images for each microservice (API Gateway, Vector Search Node, ETL Worker, Frontend).
        
    5. **Stage 4 - Registry Push:** Tags the Docker images with the Git commit hash and pushes them to a secure Container Registry (e.g., AWS ECR or GitHub Packages).
        
    6. **Stage 5 - Deployment (Main Branch Only):** Triggers a webhook or runs an infrastructure script (Terraform/Ansible) to instruct the production cloud servers to pull the new images and perform a rolling restart.
        

**3) Tech Stack & Libraries**

- **Orchestration:** GitHub Actions (or GitLab CI).
    
- **Containerization:** Docker & Docker Compose.
    
- **Code Quality:** `Ruff`, `mypy` (Python), `ESLint`, `Prettier` (TypeScript/React).
    
- **Testing Frameworks:** `pytest` (Backend), `vitest` (Frontend).
    
- **Registry:** GitHub Container Registry (ghcr.io) or AWS Elastic Container Registry (ECR).
    

**4) Inputs (Ingress)**

- **Source:** Webhook payloads from the Git version control system (e.g., GitHub).
    
- **Payload Schema (Git Event Context):**
    
    JSON
    
    ```
    {
      "event_name": "push",
      "ref": "refs/heads/main",
      "after": "a1b2c3d4e5f6g7h8i9j0...",
      "repository": {
        "name": "topo-acoustic-engine"
      },
      "commits": [
        {
          "message": "feat: optimized vietoris-rips filtration loop",
          "author": { "name": "Dev" }
        }
      ]
    }
    ```
    

**5) Outputs (Egress)**

- **Destination:** Container Registry (Images) & Cloud Provider (Deployment Triggers).
    
- **Output Payload Schema (Deployment Webhook):**
    
    JSON
    
    ```
    {
      "deployment_status": "success",
      "image_tags": {
        "api-gateway": "ghcr.io/user/topo-api:a1b2c3d",
        "hnsw-node": "ghcr.io/user/topo-hnsw:a1b2c3d",
        "etl-worker": "ghcr.io/user/topo-etl:a1b2c3d"
      },
      "timestamp": "2026-07-01T15:00:00Z"
    }
    ```
    

**6) Failure States**

- **Test Failure:** A PR contains code that breaks the mathematical output of the Topology Engine. _Recovery:_ The pipeline immediately halts, marks the GitHub PR with a red "Failed" status, blocks the ability to merge, and sends a notification alerting the developer to fix the failing tests.
    
- **Build Failure (OOM / Dependency Error):** Heavy libraries like `gudhi` or `PyTorch` fail to install during the Docker build step due to runner memory limits or missing C++ compilers. _Recovery:_ The pipeline fails the build stage. The developer must optimize the Dockerfile (e.g., using pre-compiled wheels) or allocate larger runners.
    
- **Deployment Timeout:** The production server fails to pull the new Docker image within the allotted time. _Recovery:_ The deployment script aborts and automatically triggers a rollback to the previous known-good Docker image tag, ensuring zero downtime for live users.
    

**7) Performance Constraints**

- **Pipeline Execution Time:** The entire CI pipeline (Lint $\rightarrow$ Test $\rightarrow$ Build) must complete in **< 10 minutes** to maintain developer velocity.
    
- **Caching:** Because compiling C++ topological libraries or downloading PyTorch models takes significant time, the pipeline MUST utilize strict layer caching (`actions/cache` for pip wheels and node_modules, and Docker layer caching for image builds).
    
- **Runner Compute:** The CI runners executing the tests for the Topology Engine require at least **4GB of RAM** to prevent random Out-Of-Memory crashes during the Vietoris-Rips test suites.
    

**8) Validation Strategy**

- **Red-Green-Refactor Pipeline Test:** Create a "dummy" pull request containing a deliberate syntax error or failing math assertion. Verify that the CI pipeline successfully catches the error and blocks the merge. Fix the error, push the commit, and verify the pipeline passes.
    
- **Deployment Dry-Run:** Configure a staging environment identical to production. Push a benign UI change to a `staging` branch. Observe the CI/CD pipeline automatically build the image and deploy it. Manually visit the staging URL to assert the UI change is visible, proving the end-to-end delivery mechanism functions correctly without human intervention.