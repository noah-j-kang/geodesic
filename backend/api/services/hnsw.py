import httpx
from typing import List, Dict, Any
from core.config import settings

async def query_hnsw_node(target_vector: List[float], limit: int) -> List[Dict[str, Any]]:
    """
    Queries the HNSW Vector Node microservice.
    Returns a list of dicts: {"spotify_track_id": str, "distance_l2": float}
    """
    async with httpx.AsyncClient(timeout=0.05) as client: # 50ms strict timeout
        response = await client.post(
            f"{settings.HNSW_NODE_URL}/search",
            json={"vector": target_vector, "k": limit}
        )
        response.raise_for_status()
        return response.json()
