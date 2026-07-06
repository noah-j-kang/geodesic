from supabase import create_client, Client
from typing import List, Dict, Any
from core.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def fetch_track_metadata(spotify_track_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """
    Fetches track metadata from Supabase for a list of track IDs.
    Returns a dictionary mapping spotify_track_id to metadata dict.
    """
    if not spotify_track_ids:
        return {}

    response = supabase.table("tracks").select("spotify_track_id, artist_name, track_title, preview_url, album_art_url").in_("spotify_track_id", spotify_track_ids).execute()

    metadata_map = {}
    for row in response.data:
        track_id = row.pop("spotify_track_id")
        metadata_map[track_id] = row

    return metadata_map

def upsert_user_session(user_id: str, umap_x: float, umap_y: float, target_vector: List[float]):
    """
    Upserts the user's episodic state.
    """
    data = {
        "user_id": user_id,
        "umap_x": umap_x,
        "umap_y": umap_y,
        "current_target_vector": target_vector
    }
    supabase.table("user_sessions").upsert(data).execute()
