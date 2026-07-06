from pydantic import BaseModel, Field
from typing import List

class UserCoordinates(BaseModel):
    umap_x: float
    umap_y: float

class RecommendRequest(BaseModel):
    target_vector: List[float] = Field(..., min_length=1500, max_length=1500)
    limit: int = Field(default=20, ge=1, le=100)
    user_coordinates: UserCoordinates

class TrackMetadata(BaseModel):
    artist_name: str
    track_title: str
    preview_url: str | None = None
    album_art_url: str | None = None

class TrackResult(BaseModel):
    spotify_track_id: str
    distance_l2: float
    metadata: TrackMetadata

class RecommendResponse(BaseModel):
    query_latency_ms: float
    results: List[TrackResult]

class SessionState(BaseModel):
    umap_x: float
    umap_y: float
    current_target_vector: List[float] = Field(..., min_length=1500, max_length=1500)

class SessionUpdateRequest(BaseModel):
    query_type: str = "session_update"
    user_id: str
    session_state: SessionState
