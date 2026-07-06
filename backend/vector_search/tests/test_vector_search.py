import os
import pytest
import numpy as np
from ..hnsw_node import HNSWNode
from ..semantic_router import SemanticRouter

# --- HNSW Node Tests ---

def test_mathematical_precision():
    """
    Mathematical Precision Testing: Initialize an empty index. Insert vector A.
    Insert vector B (which is exactly vector A + 0.1 on one axis).
    Query the index using vector A. Assert that vector B is returned with the exact,
    mathematically predicted L2 distance.
    """
    node = HNSWNode(dim=1500)

    # Vector A
    vec_a = np.random.rand(1500).tolist()

    # Vector B: A + 0.1 on the first axis
    vec_b = vec_a.copy()
    vec_b[0] += 0.1

    node.add_item("track_A", vec_a)
    node.add_item("track_B", vec_b)

    # Query with Vector A
    results = node.query(vec_a, k=2)

    # Assert track_A is closest (distance 0)
    assert results[0][0] == "track_A"
    assert pytest.approx(results[0][1], abs=1e-5) == 0.0

    # Assert track_B is second closest (L2 distance should be (0.1)^2 = 0.01)
    # hnswlib with space='l2' returns squared L2 distance
    assert results[1][0] == "track_B"
    assert pytest.approx(results[1][1], abs=1e-5) == 0.01

def test_cold_start_resilience():
    """
    Cold-Start Resilience Testing: Write a test script that inserts vectors,
    forces a .snapshot() command. Spin up a new process (re-instantiate),
    force a .rehydrate(), and query it. Assert that the Bi-directional Hash Map
    successfully mapped the integer IDs back to the original string IDs.
    """
    index_path = "test_index_snapshot.bin"
    id_map_path = "test_id_map.json"

    # Cleanup before test
    if os.path.exists(index_path): os.remove(index_path)
    if os.path.exists(id_map_path): os.remove(id_map_path)

    # Process 1
    node1 = HNSWNode(dim=1500, index_path=index_path, id_map_path=id_map_path)

    vectors = {}
    for i in range(100):
        track_id = f"spotify_track_{i}"
        vec = np.random.rand(1500).tolist()
        vectors[track_id] = vec
        node1.add_item(track_id, vec)

    node1.snapshot()

    # Process 2 (simulating cold start)
    node2 = HNSWNode(dim=1500, index_path=index_path, id_map_path=id_map_path)

    # Query with a known vector
    target_id = "spotify_track_42"
    target_vec = vectors[target_id]

    results = node2.query(target_vec, k=1)

    assert results[0][0] == target_id
    assert pytest.approx(results[0][1], abs=1e-5) == 0.0

    # Cleanup after test
    if os.path.exists(index_path): os.remove(index_path)
    if os.path.exists(id_map_path): os.remove(id_map_path)

# --- Semantic Router Tests ---

def test_semantic_boundary():
    """
    Semantic Boundary Testing: Maintain a static test suite of edge-case prompts.
    Assert that the LLM consistently maps them correctly based on keywords.
    """
    router = SemanticRouter(dim=1500)

    # Default is 0.5 for all

    # "chaos" -> H1 (cyclic frequency) > 0.9
    weights = router.parse_semantics("Maximum chaos")
    assert weights["cyclic_frequency_h1"] > 0.9

    # "silence" -> H0 (timbral density) < 0.1
    weights = router.parse_semantics("Total silence")
    assert weights["timbral_density_h0"] < 0.1

    # "repetitive" -> H1 > 0.5 (specifically 0.5 + 0.3 = 0.8)
    weights = router.parse_semantics("Repetitive drum beat")
    assert weights["cyclic_frequency_h1"] >= 0.8

def test_vector_dimension_integrity():
    """
    Vector Dimension Integrity: Programmatically run randomized JSON parameter
    sets through the Vector Synthesis blending function. Assert that every single
    output is exactly 1500 dimensions, contains no NaN values, and remains mathematically normalized.
    """
    router = SemanticRouter(dim=1500)

    for _ in range(100):
        weights = {
            "timbral_density_h0": np.random.uniform(0.0, 1.0),
            "cyclic_frequency_h1": np.random.uniform(0.0, 1.0),
            "spectral_brightness": np.random.uniform(0.0, 1.0),
            "transient_sharpness": np.random.uniform(0.0, 1.0)
        }

        vec = router.synthesize_vector(weights)

        # Check dimensions
        assert len(vec) == 1500

        # Check no NaNs
        assert not np.isnan(vec).any()

        # Check normalization (norm should be ~1.0)
        norm = np.linalg.norm(vec)
        assert pytest.approx(norm, abs=1e-5) == 1.0
