### **Sub-Project: Semantic Router**

**1) Description**

The Semantic Router is the linguistic bridge of the TopoAcoustic Discovery Engine. While the core platform operates strictly on pure mathematical geometry (Betti numbers, topological persistence, Wasserstein distances), human users do not communicate in mathematical arrays. They search for music using qualitative, descriptive language (e.g., "dark, heavy textures with low rhythmic complexity").

This sub-project exists to translate that unstructured natural language into a synthetic, high-dimensional topological vector—a "ghost coordinate" within the acoustic manifold. By mapping human adjectives to specific geometric features (e.g., "heavy" to $H_0$ Timbral Density, "repetitive" to $H_1$ Cyclic Frequency), the Semantic Router allows users to intuitively navigate the complex mathematical space of the HNSW index without needing a degree in topology.

**2) Architecture & Logic**

- **Pattern:** Stateless Inference Endpoint / NLP Microservice.
    
- **Pipeline Logic:**
    
    1. **Ingestion & Sanitization:** Receives a raw text string from the API Gateway. Strips special characters and enforces a strict character limit (e.g., 250 characters) to prevent prompt injection or rambling.
        
    2. **Semantic Parsing (LLM/Embedding Layer):** Injects the sanitized string into a strictly formatted zero-shot or few-shot prompt. A fast, quantized inference model evaluates the text and outputs a JSON mapping of acoustic axes (e.g., Timbral Density, Transient Sharpness) formatted as normalized floats from 0.0 to 1.0.
        
    3. **Vector Synthesis:** Parses the LLM's JSON output. Using a mathematical blending function (e.g., Spherical Linear Interpolation - SLERP), it blends hardcoded "baseline" topological vectors according to the extracted weights.
        
    4. **Egress:** The resulting synthetic 1500-dimensional vector is passed directly to the HNSW Vector Node for a KNN query, effectively dropping a pin in the manifold that represents the user's text prompt.
        

**3) Tech Stack & Libraries**

- **Language:** Python 3.10+
    
- **NLP & Parsing:** `transformers` (HuggingFace) or `llama-cpp-python` (for running quantized local instruction models like Llama-3 8B or Phi-3).
    
- **Matrix Operations:** `numpy` (for vector synthesis and interpolation).
    
- **Service Framework:** `FastAPI` (for exposing the internal inference endpoint to the API Gateway).
    

**4) Inputs (Ingress)**

- **Source:** API Gateway (originating from the user's UI Command Line).
    
- **Payload Schema (JSON Contract):**
    
    JSON
    
    ```
    {
      "user_prompt": "dark, heavy textures with low rhythmic complexity and shimmering top-end",
      "limit": 20
    }
    ```
    

**5) Outputs (Egress)**

- **Destination:** The internal HNSW Vector Node (to fetch tracks), and ultimately the API Gateway.
    
- **Output Payload Schema (JSON Contract):**
    
    JSON
    
    ```
    {
      "interpreted_parameters": {
        "timbral_density_h0": 0.85,
        "cyclic_frequency_h1": 0.20,
        "spectral_brightness": 0.75,
        "transient_sharpness": 0.30
      },
      "target_vector": [0.012, 0.443, 0.991, 0.000, 0.114, ...],
      "synthesis_time_ms": 145
    }
    ```
    
    _(Note: The `interpreted_parameters` are sent back to the UI so the Geodesic HUD sliders snap to match the text prompt, while the `target_vector` goes to the HNSW index)._
    

**6) Failure States**

- **LLM Hallucination / JSON Parse Error:** The inference model outputs conversational text instead of the strictly required JSON format. _Recovery:_ The module attempts a regex extraction of the JSON block. If that fails, it catches the `JSONDecodeError` and gracefully falls back to a "Neutral Vector" (all weights set to 0.5) to prevent breaking the UI.
    
- **Nonsense Prompts / Injection:** The user inputs something irrelevant like "Write me a poem about dogs." _Recovery:_ The strict system prompt instructs the LLM to output 0.5 for all parameters if acoustic intent cannot be determined. The system treats it as a jump to the exact center of the manifold.
    
- **Inference Timeout:** The NLP model hangs. _Recovery:_ The request is wrapped in a hard 250ms timeout. If breached, the router aborts inference and returns the Neutral Vector.
    

**7) Performance Constraints**

- **Inference Latency:** The entire process (Text Ingestion $\rightarrow$ LLM Parsing $\rightarrow$ Vector Synthesis) must complete in **< 300 milliseconds**. (This strict requirement mandates a highly optimized local model rather than relying on standard commercial API endpoints like OpenAI, which often fluctuate between 500ms - 2000ms).
    
- **Memory Limits:** If using a quantized local LLM, the worker requires a dedicated GPU with at least **6GB to 8GB of VRAM**. If executing via CPU using ONNX runtime, it requires highly optimized threading to prevent bottlenecking.
    
- **Concurrency:** Must support batch processing or queue management to handle concurrent search queries from multiple users without causing Out-of-Memory (OOM) errors on the GPU.
    

**8) Validation Strategy**

- **Semantic Boundary Testing:** Maintain a static test suite of 50 edge-case prompts (e.g., "Maximum chaos", "Total silence", "Repetitive drum beat"). Assert that the LLM consistently maps "Maximum chaos" to an $H_1$ parameter $> 0.9$, and "Total silence" to an $H_0$ parameter $< 0.1$.
    
- **Vector Dimension Integrity:** Programmatically run 100 randomized JSON parameter sets through the Vector Synthesis blending function. Assert that every single output is exactly 1500 dimensions, contains no `NaN` values, and remains mathematically normalized.