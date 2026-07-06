### **Sub-Project: Cloud Provisioning**

**1) Description**

Cloud Provisioning is the Infrastructure-as-Code (IaC) backbone of the TopoAcoustic Discovery Engine. Because the platform relies on highly specialized hardware profiles—compute-optimized CPUs for the math-heavy Topology Engine and memory-optimized RAM for the HNSW Vector Node—manually configuring these servers via a cloud console (click-ops) is highly error-prone and unscalable.

This sub-project translates the entire physical architecture of the application into declarative code. It exists to guarantee that the production, staging, and disaster recovery environments are perfectly identical, reproducible from scratch in minutes, and securely partitioned via strict networking rules (VPCs). By automating the provisioning of servers, load balancers, and managed databases, this module allows a solo developer or small team to manage enterprise-grade infrastructure.

**2) Architecture & Logic**

- **Pattern:** Declarative Infrastructure as Code (IaC) / Immutable Infrastructure.
    
- **Pipeline Logic:**
    
    1. **Configuration Definition:** Infrastructure is defined in `.tf` (Terraform) files. These files specify the exact AWS/GCP resources needed (e.g., an ECS cluster, specific EC2 instance types, Security Groups).
        
    2. **State Management:** The "source of truth" regarding what is currently deployed is stored in a remote, encrypted bucket (e.g., AWS S3) with a state lock mechanism (e.g., DynamoDB) to prevent concurrent deployments from corrupting the environment.
        
    3. **Plan (Dry Run):** Triggered by the CI/CD pipeline, the IaC tool compares the code against the remote state and generates an execution plan, detailing exactly what will be created, modified, or destroyed.
        
    4. **Apply (Execution):** Upon approval (or automatic merge to `main`), the tool executes API calls to the Cloud Provider to provision the resources in the exact correct dependency order (e.g., creating the VPC network before spinning up the HNSW container).
        
    5. **Auto-Scaling Orchestration:** Defines the threshold alarms (e.g., "If HNSW RAM > 85%, spin up a read-replica node").
        

**3) Tech Stack & Libraries**

- **IaC Tool:** Terraform (or OpenTofu).
    
- **Cloud Provider (Example):** AWS (Amazon Web Services).
    
- **Target Services:** Amazon ECS (Elastic Container Service) or EKS, EC2 (c6i instances for ETL compute, r6i instances for HNSW memory), Application Load Balancers (ALB), and VPC.
    
- **Security & Linting:** `tfsec` (Security scanner) and `tflint`.
    

**4) Inputs (Ingress)**

- **Source:** Developer commits to the IaC repository and CI/CD environment variables.
    
- **Payload Schema (Configuration File - `variables.tfvars`):**
    
    Terraform
    
    ```
    environment         = "production"
    hnsw_instance_type  = "r6i.large" # 16GB RAM for Vector Graph
    etl_instance_type   = "c6i.xlarge" # Compute optimized for TDA math
    min_etl_workers     = 2
    max_etl_workers     = 10
    vpc_cidr_block      = "10.0.0.0/16"
    ```
    

**5) Outputs (Egress)**

- **Destination:** The Cloud Provider (API calls) and the Remote State Bucket.
    
- **Output Payload Schema (Terraform Output / State File):**
    
    JSON
    
    ```
    {
      "api_gateway_url": "https://api.topoacoustic.io",
      "vpc_id": "vpc-0a1b2c3d4e5f",
      "hnsw_internal_ip": "10.0.1.45",
      "deployment_status": "Apply complete! Resources: 12 added, 0 changed, 0 destroyed."
    }
    ```
    

**6) Failure States**

- **State Lock Timeout:** Two developers (or CI pipelines) attempt to deploy infrastructure simultaneously. _Recovery:_ The DynamoDB state lock blocks the second run, throwing a `LockError`. The pipeline halts gracefully, requiring the second deployment to wait and re-run.
    
- **Cloud Provider Quota Exceeded:** The auto-scaler attempts to spin up 20 compute nodes, but the AWS account has a hard limit of 10. _Recovery:_ The cloud API rejects the request. The IaC pipeline catches the `QuotaExceededException`, marks the deployment as degraded, and alerts DevOps to request a quota increase.
    
- **Configuration Drift:** Someone manually changes a security group rule in the AWS Console, causing the actual infrastructure to drift from the code. _Recovery:_ The next `terraform plan` detects the drift and automatically proposes overwriting the manual change back to the coded baseline, strictly enforcing the Git repository as the single source of truth.
    

**7) Performance Constraints**

- **Provisioning Speed:** A full "from scratch" disaster recovery deployment (spinning up the entire VPC, clusters, and load balancers) must complete in **< 15 minutes**. Standard incremental updates should take **< 2 minutes**.
    
- **Cost Limits (Budget Spikes):** Auto-scaling groups for the ETL workers must have a strict `max_capacity` parameter enforced to prevent infinite horizontal scaling from racking up a massive cloud bill if the Spotify queue accidentally loops.
    
- **Security Isolation:** The HNSW Vector Node and ETL Workers must be placed in **Private Subnets** with no public IP addresses. Only the API Gateway is permitted in the Public Subnet behind a Load Balancer.
    

**8) Validation Strategy**

- **Static Analysis:** Run `tfsec` as a pre-commit hook. Assert that no resources are configured with open ingress ports (e.g., `0.0.0.0/0` on port 22) and that S3 buckets are explicitly set to private and encrypted.
    
- **Automated Plan Verification:** The CI pipeline runs `terraform plan` on every Pull Request and outputs the exact resource changes as a comment on the PR for human review before any real infrastructure is touched.
    
- **Ephemeral Staging Teardown:** Once a week, an automated cron job runs `terraform apply` to an isolated `staging` workspace, runs a suite of API integration tests against the newly built cloud, and then successfully executes `terraform destroy` to ensure the teardown logic cleanly removes all resources without leaving orphaned, billable assets.