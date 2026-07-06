### **Workstream 5: DevOps & Infrastructure**

**1) Description of the Workstream**

Workstream 5: DevOps & Infrastructure is the foundational scaffolding that brings the TopoAcoustic Discovery Engine to life in a production environment. Given the highly decoupled, domain-driven nature of this project—mixing asynchronous CPU-heavy mathematics (Workstream 1), volatile high-RAM in-memory search graphs (Workstream 2), and high-concurrency stateless web APIs (Workstream 3)—a robust infrastructure strategy is not optional; it is mandatory to prevent catastrophic bottlenecks and system failures.

This workstream manages the orchestration of containerized microservices, establishes secure inter-service communication via message brokers, and automates the entire deployment lifecycle. Its primary goal is to ensure that a developer can spin up the entire multi-node ecosystem locally with a single command, while simultaneously providing the automated cloud provisioning blueprints required to scale the platform to thousands of simultaneous users without manual intervention.

**2) Definition of Done (DoD) / Key Deliverables**

To consider Workstream 5 complete and ready to support production traffic, the following conditions must be met and verifiable:

- **Local Orchestration:** A master `docker-compose.yml` file is configured so that executing `docker-compose up` successfully spins up the entire ecosystem (React frontend, FastAPI Gateway, HNSW Node, Redis Broker, ETL Workers) with proper internal networking, environment variables, and persistent local volume mounts.

- **Message Broker Configuration:** A Redis (or RabbitMQ) instance is fully provisioned and configured as the central message broker, successfully routing asynchronous extraction tasks to the ETL workers without message dropping or dead-lock.

- **Automated CI/CD Pipelines:** A Continuous Integration/Continuous Deployment pipeline (e.g., GitHub Actions) is established that automatically runs unit tests, lints Python/TypeScript code, builds new Docker images, and pushes them to a container registry upon every merge to the `main` branch.

- **Infrastructure as Code (IaC):** Terraform (or an equivalent IaC tool) scripts are written and tested to programmatically provision the cloud production environment. This includes isolating compute-optimized instances for the Topology Engine and memory-optimized instances for the HNSW Vector Node.

- **Observability & Alerting:** A centralized logging and telemetry stack (e.g., Prometheus/Grafana or Datadog) is integrated. It must successfully track API Gateway latency, Celery queue lengths, and—critically—monitor the RAM usage of the HNSW Vector Node, triggering automated alerts before an Out-of-Memory (OOM) crash occurs.

- **Secure Secret Management:** A strict secret management protocol is enforced (e.g., AWS Secrets Manager, Doppler, or GitHub Secrets). All database passwords, Spotify API keys, and JWT signing strings are injected securely at runtime, completely eliminating hardcoded secrets from the codebase.