from fastapi import APIRouter, Depends, HTTPException, status
from schemas.gateway import RecommendRequest, RecommendResponse, TrackResult, TrackMetadata
from services.hnsw import query_hnsw_node
from services.db import fetch_track_metadata
from core.auth import verify_jwt
import httpx
import time
import asyncio

router = APIRouter()

@router.post("/recommend", response_model=RecommendResponse)
async def recommend(request: RecommendRequest, user_id: str = Depends(verify_jwt)):
    start_time = time.perf_counter()

    try:
        # Step 1: Query HNSW Node
        # HNSW returns e.g. [{"id": "spotify_id", "distance": 0.042}, ...]
        hnsw_results = await query_hnsw_node(request.target_vector, request.limit)
    except httpx.TimeoutException:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="HNSW Node timeout")
    except httpx.HTTPError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="HNSW Node unavailable")

    if not hnsw_results:
        return RecommendResponse(query_latency_ms=(time.perf_counter() - start_time) * 1000, results=[])

    # Extract track IDs, expecting 'spotify_track_id' in HNSW response, or adjust as per your HNSW node's mock response
    track_ids = [res.get("spotify_track_id", res.get("id")) for res in hnsw_results if res.get("spotify_track_id") or res.get("id")]

    # Run DB fetch in a threadpool to not block the async event loop
    # since supabase-py's execute is synchronous
    loop = asyncio.get_running_loop()
    try:
        metadata_map = await loop.run_in_executor(None, fetch_track_metadata, track_ids) # type: ignore
    except Exception as e:
        # Handle potential db errors gracefully
        metadata_map = {}

    # Step 3: Zip mathematical distances and track metadata
    results = []
    for h_res in hnsw_results:
        tid = h_res.get("spotify_track_id", h_res.get("id"))
        if not tid:
            continue

        dist = h_res.get("distance_l2", h_res.get("distance", 0.0))
        meta = metadata_map.get(tid)

        # Omit gracefully if metadata not found
        if not meta:
            continue

        # Parse into Pydantic models
        track_meta = TrackMetadata(
            artist_name=meta.get("artist_name", "Unknown Artist"),
            track_title=meta.get("track_title", "Unknown Track"),
            preview_url=meta.get("preview_url"),
            album_art_url=meta.get("album_art_url")
        )

        results.append(TrackResult(
            spotify_track_id=tid,
            distance_l2=dist,
            metadata=track_meta
        ))

    latency_ms = (time.perf_counter() - start_time) * 1000

    return RecommendResponse(query_latency_ms=latency_ms, results=results)
