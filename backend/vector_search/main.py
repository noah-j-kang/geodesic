from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import time

from .hnsw_node import HNSWNode
from .semantic_router import SemanticRouter

app = FastAPI(title="Vector Search Node", version="0.1.0")

# Instantiate singleton services
hnsw_node = HNSWNode()
semantic_router = SemanticRouter()

# Data models
class IngestPayload(BaseModel):
    spotify_track_id: str
    topological_signature: List[float] = Field(..., min_items=1500, max_items=1500)

class QueryPayload(BaseModel):
    target_vector: List[float] = Field(..., min_items=1500, max_items=1500)
    k: int = 20

class RoutePayload(BaseModel):
    user_prompt: str
    limit: int = 20

@app.post("/ingest", status_code=201)
def ingest_vector(payload: IngestPayload):
    """Ingests a new vector into the HNSW graph."""
    start_time = time.time()
    try:
        hnsw_node.add_item(payload.spotify_track_id, payload.topological_signature)
        return {"status": "success", "ingestion_time_ms": (time.time() - start_time) * 1000}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
def search_vectors(payload: QueryPayload):
    """Queries the HNSW graph for nearest neighbors."""
    start_time = time.time()
    try:
        results = hnsw_node.query(payload.target_vector, k=payload.k)
        formatted_results = [{"spotify_track_id": track_id, "distance_l2": dist} for track_id, dist in results]

        return {
            "query_time_ms": (time.time() - start_time) * 1000,
            "results": formatted_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/route")
def route_semantics(payload: RoutePayload):
    """Translates a natural language string to a target vector and queries it."""
    start_time = time.time()
    try:
        # 1. Parse semantics and synthesize vector
        router_result = semantic_router.process_prompt(payload.user_prompt)

        return {
            "interpreted_parameters": router_result["interpreted_parameters"],
            "target_vector": router_result["target_vector"],
            "synthesis_time_ms": (time.time() - start_time) * 1000
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/snapshot")
def trigger_snapshot():
    """Forces the HNSW node to save its state to disk."""
    try:
        hnsw_node.snapshot()
        return {"status": "snapshot saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
