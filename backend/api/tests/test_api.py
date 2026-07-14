from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app

# Need to override dependency in app correctly
from core.auth import verify_jwt

client = TestClient(app)

def override_verify_jwt():
    return "mock_user_id"

app.dependency_overrides[verify_jwt] = override_verify_jwt

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@patch("routers.recommend.query_hnsw_node")
@patch("routers.recommend.fetch_track_metadata")
def test_recommend_scatter_gather(mock_fetch_metadata, mock_query_hnsw):
    mock_query_hnsw.return_value = [
        {"spotify_track_id": "track_1", "distance_l2": 0.1},
        {"spotify_track_id": "track_2", "distance_l2": 0.5}
    ]
    mock_fetch_metadata.return_value = {
        "track_1": {"artist_name": "Artist 1", "track_title": "Title 1", "preview_url": None, "album_art_url": None},
        "track_2": {"artist_name": "Artist 2", "track_title": "Title 2", "preview_url": "url", "album_art_url": "url2"}
    }

    payload = {
        "target_vector": [0.0] * 1500,
        "limit": 20,
        "user_coordinates": {"umap_x": 1.0, "umap_y": 2.0}
    }

    response = client.post("/recommend", json=payload, headers={"Authorization": "Bearer mock-token"})
    assert response.status_code == 200
    data = response.json()
    assert "query_latency_ms" in data
    assert len(data["results"]) == 2

    assert data["results"][0]["spotify_track_id"] == "track_1"
    assert data["results"][0]["metadata"]["artist_name"] == "Artist 1"
    assert data["results"][1]["distance_l2"] == 0.5

@patch("routers.recommend.query_hnsw_node")
def test_recommend_validation_error(mock_query_hnsw):
    payload = {
        "target_vector": [0.0] * 1499, # Invalid length
        "limit": 20,
        "user_coordinates": {"umap_x": 1.0, "umap_y": 2.0}
    }
    response = client.post("/recommend", json=payload, headers={"Authorization": "Bearer mock-token"})
    assert response.status_code == 422
