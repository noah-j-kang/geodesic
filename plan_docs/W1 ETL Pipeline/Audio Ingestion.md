### **Sub-Project: Audio Ingestion**

**1) Description**

The Audio Ingestion module is the entry point of the TopoAcoustic ETL pipeline. It acts as the automated "scout," interfacing with external music distribution APIs (primarily Spotify) to discover obscure tracks and securely download their 30-second audio previews.

This module exists to solve the "cold-start" problem of the platform by ensuring a constant influx of non-commercial audio. By executing strict API filtering, it guarantees that only tracks meeting the uncompromising "underground" criteria (e.g., popularity score < 50) are passed down the line. It insulates the heavy mathematical engines from the chaos of network unreliability and acts as the sole manager of raw binary audio.

**2) Architecture & Logic**

- **Pattern:** Asynchronous Background Worker (Producer model).
    
- **Pipeline Logic:**
    
    1. **Authentication:** Maintains a rotating Client Credentials flow with the Spotify Web API.
        
    2. **Querying/Polling:** Executes dynamic searches using randomized niche genre seeds, specific playlist IDs, or year brackets.
        
    3. **The Filter Gate:** For every track returned, it evaluates two strict conditions: `track.popularity < 50` AND `track.preview_url is NOT NULL`.
        
    4. **Acquisition:** If the track passes the gate, it opens an asynchronous HTTP stream to download the `.mp3` payload into an ephemeral `/tmp` directory.
        
    5. **Handoff:** Pushes a payload to the internal message queue containing the local file path and track metadata, alerting the _Feature Extraction_ sub-project that a file is ready.
        
    6. **Garbage Collection:** Listens for a "processing complete" or "failed" signal from downstream modules and executes an `os.remove()` command to delete the `.mp3` file, preventing server storage bloat.
        

**3) Tech Stack & Libraries**

- **Language:** Python 3.10+
    
- **API Client:** `spotipy` (for Spotify search and metadata).
    
- **Async HTTP/Networking:** `httpx` or `aiohttp` (for non-blocking `.mp3` streaming).
    
- **Queue/Broker Integration:** `redis-py` or `celery` (to push tasks to the next module).
    
- **Environment Management:** `pydantic-settings` (for securely handling Spotify Client IDs/Secrets).
    

**4) Inputs (Ingress)**

- **Source:** Spotify Web API (`/v1/search` or `/v1/playlists/{id}/tracks` endpoints).
    
- **Trigger:** Scheduled Cron job or a continuous daemon loop.
    
- **Payload Schema (Expected API Response Snippet):**
    
    JSON
    
    ```
    {
      "id": "3n3PpDZ7sJ...",
      "name": "Track Title",
      "artists": [{"name": "Artist Name"}],
      "popularity": 12,
      "preview_url": "https://p.scdn.co/mp3-preview/..."
    }
    ```
    

**5) Outputs (Egress)**

- **Destination:** Message Queue (Redis/Celery) feeding the Feature Extraction module.
    
- **Output Payload Schema (JSON Contract):**
    
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
    

**6) Failure States**

- **API Rate Limiting (HTTP 429):** The worker catches `spotipy.exceptions.SpotifyException`. It halts, applies exponential backoff logic (sleeps for $X$ seconds), and retries.
    
- **Dead/Null Preview URLs:** Not all obscure tracks have 30s previews. The module logs the track ID as "Preview Unavailable" and skips it immediately.
    
- **Network Drop / Corrupt File:** If the `.mp3` download stream drops mid-way, it catches `httpx.ReadTimeout`. It immediately deletes the partial file fragment in `/tmp`, logs a warning, and skips the track to prevent the DSP engine from choking on corrupt headers.
    
- **Disk Space Exhaustion:** If the `/tmp` directory fills up due to downstream bottlenecks, the ingestion worker triggers a critical alert, halts downloading, and initiates an emergency purge of any files older than 10 minutes.
    

**7) Performance Constraints**

- **Throughput:** Must be capable of discovering, filtering, and downloading at least 1 track per second per worker thread.
    
- **Memory Constraints:** Minimal footprint required (under 150MB of RAM), as no audio processing happens here.
    
- **Storage Limits:** The `/tmp` directory must never exceed 5GB. Garbage collection must be merciless.
    
- **Concurrency:** Limited to 5-10 concurrent async download streams to respect Spotify API rate limits and avoid IP bans.
    

**8) Validation Strategy**

- **Unit Testing (Filtering):** Mock the `spotipy` client response to return a static JSON array containing one track with `popularity: 49` and one with `popularity: 51`. Assert that the ingestion function drops the 51-popularity track and only queues the 49-popularity track.
    
- **Integration Testing (Acquisition):** Run a test script that hits the live API, downloads a real `.mp3` file to the `/tmp` directory, verifies the local file size is $> 0$ bytes, and then triggers the garbage collection function to ensure the file is successfully deleted from disk.