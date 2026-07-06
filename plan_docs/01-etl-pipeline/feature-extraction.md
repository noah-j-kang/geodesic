### **Sub-Project: Feature Extraction**

**1) Description**

The Feature Extraction module acts as the mathematical translator of the TopoAcoustic engine. Raw audio waveforms are inherently messy, fluctuating rapidly across millions of samples in ways that are computationally hostile to topological mapping. This module exists to strip away that noise and distill the audio down into a uniform, deterministic mathematical matrix.

By focusing strictly on low-level psychoacoustic coordinates—specifically Mel-Frequency Cepstral Coefficients (timbre), Spectral Centroids (brightness), and Daubechies Wavelets (transient rhythm)—this module creates a standardized "acoustic fingerprint" for every track. It ensures that the downstream Topology Engine receives perfectly normalized, dimensionally consistent time-series data, regardless of how the original audio was recorded or mastered.

**2) Architecture & Logic**

- **Pattern:** Stateless Data Transformer / CPU-Bound Worker Node.
    
- **Pipeline Logic:**
    
    1. **Ingestion:** Listens to the message queue and receives the local file path of a downloaded `.mp3`.
        
    2. **Decoding & Resampling:** Uses `librosa` to load the audio into memory, strictly enforcing `sr=22050` (22.05 kHz) and `mono=True` to normalize the input space.
        
    3. **Silence Trimming:** Applies a decibel-threshold trim to remove leading or trailing digital silence that could skew the topological geometry.
        
    4. **Matrix Construction:** * Calculates 20 MFCCs across time $T$.
        
        - Calculates the Spectral Centroid across time $T$.
            
        - Calculates the db4 Discrete Wavelet Transform, grouping energy into 4 structural bands.
            
    5. **Normalization & Fusion:** Applies Z-score normalization to each feature row independently (ensuring loud and quiet tracks are evaluated purely on structural shape, not volume). The arrays are stacked to form a unified $(25 \times T)$ matrix.
        
    6. **Egress & Cleanup:** Serializes the matrix (e.g., Base64 encoded NumPy bytes or `.npz`), pushes it to the Topology Engine queue, and explicitly executes an `os.remove()` to delete the local `.mp3` file.
        

**3) Tech Stack & Libraries**

- **Language:** Python 3.10+
    
- **Digital Signal Processing:** `librosa` (core extraction framework).
    
- **Audio Decoding Backend:** `soundfile` and `audioread`.
    
- **Wavelet Mathematics:** `PyWavelets` (`pywt`).
    
- **Matrix Operations:** `numpy` (for fast stacking and manipulation) and `scipy.stats` (for Z-score normalization).
    

**4) Inputs (Ingress)**

- **Source:** Message Queue (Redis/Celery) populated by the Audio Ingestion module.
    
- **Payload Schema (JSON Contract):**
    
    JSON
    
    ```
    {
      "spotify_track_id": "3n3PpDZ7sJ...",
      "metadata": {
        "artist_name": "Artist Name",
        "track_title": "Track Title"
      },
      "local_audio_path": "/tmp/audio_3n3PpDZ7sJ....mp3",
      "download_timestamp": "2026-07-01T14:30:00Z"
    }
    ```
    

**5) Outputs (Egress)**

- **Destination:** Message Queue (Redis/Celery) feeding the Topology Engine.
    
- **Output Payload Schema (JSON Contract):**
    
    JSON
    
    ```
    {
      "spotify_track_id": "3n3PpDZ7sJ...",
      "metadata": {
        "artist_name": "Artist Name",
        "track_title": "Track Title"
      },
      "dsp_matrix": {
        "shape": [25, 1292], 
        "data": "<Base64_Encoded_NumPy_Bytes>"
      },
      "extraction_timestamp": "2026-07-01T14:30:02Z"
    }
    ```
    
    _(Note: Shape is 25 features by T timeframes. A 30s clip at 22.05kHz with a 512 hop-length typically yields $T \approx 1292$.)_
    

**6) Failure States**

- **Corrupt File / Decoder Failure:** If the audio file is malformed (e.g., a partial download that slipped through), `librosa.load()` will throw an `EOFError` or `audioread.NoBackendError`. _Recovery:_ Catch exception, log "Corrupt Audio", delete the file from disk, and drop the track from the pipeline entirely.
    
- **Truncated Time-Series:** If the audio clip is too short (e.g., $< 5$ seconds), the resulting matrix will lack the timeframe $T$ required for Takens' embedding. _Recovery:_ Enforce a minimum threshold (e.g., $T > 500$). If it fails, log "Insufficient Audio Length", delete, and drop.
    
- **Infinite/NaN Generation:** Certain digital static anomalies can cause divide-by-zero errors during Z-score normalization. _Recovery:_ Run `np.isnan().any()`. If true, discard the matrix and drop the track.
    

**7) Performance Constraints**

- **Execution Time:** The entire extraction process (disk read to matrix serialization) must comfortably execute in **under 1.5 seconds per track**.
    
- **Memory Limits:** Because loading raw audio arrays into memory can be expensive, a single worker process should be capped at **< 500MB of RAM**. The `librosa.load` function must enforce `duration=30` to prevent accidental OOM crashes if a full 10-minute song is erroneously downloaded.
    
- **Concurrency:** DSP is heavily CPU-bound. This module must scale via **Multiprocessing** (one worker process per physical CPU core), avoiding Python's Global Interpreter Lock (GIL) limitations associated with standard multithreading.
    

**8) Validation Strategy**

- **Deterministic Unit Testing (The Sine Wave Test):** Programmatically generate a perfect, static 440Hz Sine Wave (A4) within a test script. Pass it through the extraction pipeline. Assert using `numpy.testing.assert_allclose` that the resulting 25xT matrix exactly matches a hardcoded, expected mathematical output.
    
- **Integration Testing (Shape Validation):** Pass 10 distinct, known `.mp3` files through the pipeline. Assert that every single output matrix has exactly 25 rows, contains strictly float32 values, contains zero `NaN` or `Inf` values, and successfully triggers the deletion of the source `.mp3` file.