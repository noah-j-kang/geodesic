import base64
import numpy as np
from unittest.mock import patch, mock_open, MagicMock

# Import the celery tasks we want to test
from backend.etl.ingestion.worker import process_track
from backend.etl.dsp.worker import extract_features
from backend.etl.topology.worker import extract_topology

# Test Audio Ingestion

def test_ingestion_filtering_popularity_high():
    track_data = {
        "id": "track_123",
        "popularity": 51,
        "preview_url": "http://example.com/audio.mp3"
    }
    # Using task function directly (not as a celery task via .delay)
    result = process_track(track_data)
    assert result == {"status": "skipped", "reason": "popularity >= 50"}

def test_ingestion_filtering_no_preview():
    track_data = {
        "id": "track_124",
        "popularity": 20,
        "preview_url": None
    }
    result = process_track(track_data)
    assert result == {"status": "skipped", "reason": "no preview_url"}

@patch("backend.etl.ingestion.worker.httpx.Client")
def test_ingestion_success(mock_httpx_client):
    track_data = {
        "id": "track_125",
        "name": "Niche Track",
        "artists": [{"name": "Obscure Artist"}],
        "popularity": 49,
        "preview_url": "http://example.com/audio.mp3"
    }

    mock_response = MagicMock()
    mock_response.content = b"fake audio data"
    mock_response.raise_for_status = MagicMock()

    mock_client_instance = MagicMock()
    mock_client_instance.get.return_value = mock_response
    mock_httpx_client.return_value.__enter__.return_value = mock_client_instance

    with patch("builtins.open", mock_open()) as mock_file:
        result = process_track(track_data)

        assert "spotify_track_id" in result
        assert result["spotify_track_id"] == "track_125"
        assert result["metadata"]["artist_name"] == "Obscure Artist"
        assert result["local_audio_path"] == "/tmp/audio_track_125.mp3"
        mock_file.assert_called_with("/tmp/audio_track_125.mp3", 'wb')
        mock_file().write.assert_called_with(b"fake audio data")


# Test Feature Extraction

def test_dsp_missing_file():
    payload = {"local_audio_path": "/tmp/non_existent.mp3"}
    result = extract_features(payload)
    assert result == {"status": "failed", "reason": "audio file missing"}

@patch("backend.etl.dsp.worker.librosa.load")
@patch("backend.etl.dsp.worker.os.path.exists")
@patch("backend.etl.dsp.worker.os.remove")
def test_dsp_success(mock_remove, mock_exists, mock_load):
    # Mocking os.path.exists to always return True for the test file
    mock_exists.return_value = True

    # Generate a pure sine wave
    sr = 22050
    t = np.linspace(0, 30, sr * 30) # 30 seconds
    y = np.sin(2 * np.pi * 440 * t) # 440 Hz
    mock_load.return_value = (y, sr)

    payload = {
        "spotify_track_id": "track_123",
        "metadata": {"artist_name": "Test", "track_title": "Sine"},
        "local_audio_path": "/tmp/test_sine.mp3"
    }

    result = extract_features(payload)

    assert "dsp_matrix" in result
    shape = result["dsp_matrix"]["shape"]
    assert shape[0] == 25 # 20 MFCCs + 1 Centroid + 4 Wavelets
    assert shape[1] >= 500 # Ensure sufficient length

    mock_remove.assert_called_once_with("/tmp/test_sine.mp3")

    encoded_data = result["dsp_matrix"]["data"]
    matrix_bytes = base64.b64decode(encoded_data)
    matrix = np.frombuffer(matrix_bytes, dtype=np.float32).reshape(shape)

    # Assert deterministic structure (should not contain NaN or Inf)
    assert not np.isnan(matrix).any()
    assert not np.isinf(matrix).any()

# Test Topology Engine

def test_topology_invalid_payload():
    result = extract_topology({})
    assert result == {"status": "failed", "reason": "invalid payload"}

def test_topology_success():
    # Construct a synthetic 25xT matrix
    shape = (25, 1000)
    # A simple deterministic matrix
    t = np.linspace(0, 4*np.pi, 1000)
    matrix = np.zeros(shape, dtype=np.float32)
    for i in range(25):
        matrix[i] = np.sin(t + i*0.1)

    matrix_bytes = matrix.tobytes()
    encoded_data = base64.b64encode(matrix_bytes).decode('utf-8')

    payload = {
        "spotify_track_id": "track_123",
        "metadata": {"artist_name": "Test", "track_title": "Topology"},
        "dsp_matrix": {
            "shape": list(shape),
            "data": encoded_data
        }
    }

    result = extract_topology(payload)

    assert "topological_signature" in result
    signature = result["topological_signature"]
    assert signature["dimensions"] == 1500
    assert len(signature["vector"]) == 1500

    # Assert array contains strictly float values and no NaN/Inf
    vector = np.array(signature["vector"])
    assert not np.isnan(vector).any()
    assert not np.isinf(vector).any()

    assert "betti_summaries" in result
    betti = result["betti_summaries"]
    assert "h0_max_persistence" in betti
    assert "h1_cycle_count" in betti
    assert "h2_void_volume" in betti
    assert "compute_time_ms" in result
