import os
import time
import httpx
from celery import Celery

app = Celery('ingestion', broker=os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0'))

def run_scout():
    """
    Automated scout that polls the Deezer API for underground tracks 
    (low rank) and pushes them to the ingestion queue.
    """
    # Searching using niche genres and keywords
    queries = ["ambient", "idm", "experimental", "noise", "drone", "avant-garde", "shoegaze"]

    print("Starting TopoAcoustic Deezer Scout...")
    while True:
        for query in queries:
            try:
                print(f"Polling Deezer API for: {query}")
                with httpx.Client() as client:
                    # Search Deezer API
                    response = client.get(f"https://api.deezer.com/search?q={query}&limit=50", timeout=10.0)
                    response.raise_for_status()
                    data = response.json()
                    
                    if "data" in data:
                        for track in data["data"]:
                            # Deezer rank: higher rank = more popular. A rank < 300,000 is generally underground.
                            rank = track.get('rank', 1000000)
                            preview_url = track.get('preview')
                            
                            if rank < 300000 and preview_url:
                                print(f"Queuing Track: {track.get('title')} (Rank: {rank})")
                                # Dispatch directly to the ingestion Celery task
                                app.send_task('ingestion.process_track', args=[track])
                
            except Exception as e:
                print(f"Unexpected Error: {e}")

            time.sleep(5) # Wait 5 seconds between queries to prevent API rate limits

if __name__ == "__main__":
    run_scout()
