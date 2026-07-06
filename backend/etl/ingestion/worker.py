import os
import httpx
from datetime import datetime, timezone
from celery import Celery

app = Celery('ingestion', broker='redis://localhost:6379/0')

@app.task(name='ingestion.process_track', bind=True, max_retries=3)
def process_track(self, track_data):
    """
    track_data is expected to be a dict representing a track from Spotify API.
    """
    popularity = track_data.get('popularity', 100)
    preview_url = track_data.get('preview_url')
    track_id = track_data.get('id')

    if popularity >= 50:
        return {"status": "skipped", "reason": "popularity >= 50"}

    if not preview_url:
        return {"status": "skipped", "reason": "no preview_url"}

    local_audio_path = f"/tmp/audio_{track_id}.mp3"

    try:
        with httpx.Client() as client:
            response = client.get(preview_url, timeout=10.0)
            response.raise_for_status()
            with open(local_audio_path, 'wb') as f:
                f.write(response.content)
    except httpx.ReadTimeout:
        if os.path.exists(local_audio_path):
            os.remove(local_audio_path)
        return {"status": "failed", "reason": "download timeout"}
    except Exception as e:
        if os.path.exists(local_audio_path):
            os.remove(local_audio_path)
        return {"status": "failed", "reason": str(e)}

    payload = {
        "spotify_track_id": track_id,
        "metadata": {
            "artist_name": track_data.get('artists', [{}])[0].get('name', 'Unknown'),
            "track_title": track_data.get('name', 'Unknown')
        },
        "local_audio_path": local_audio_path,
        "download_timestamp": datetime.now(timezone.utc).isoformat()
    }

    return payload
