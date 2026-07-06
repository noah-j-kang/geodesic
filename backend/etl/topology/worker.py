import time
import base64
import numpy as np
from celery import Celery
from sklearn.decomposition import PCA
from gtda.time_series import SingleTakensEmbedding
from gtda.homology import VietorisRipsPersistence
from gtda.diagrams import PersistenceLandscape

app = Celery('topology', broker='redis://localhost:6379/0')

@app.task(name='topology.extract_topology', bind=True, time_limit=10)
def extract_topology(self, payload):
    start_time = time.time()
    try:
        dsp_matrix_data = payload.get('dsp_matrix', {})
        shape = tuple(dsp_matrix_data.get('shape', []))
        encoded_data = dsp_matrix_data.get('data')

        if not encoded_data or not shape:
            return {"status": "failed", "reason": "invalid payload"}

        matrix_bytes = base64.b64decode(encoded_data)
        matrix = np.frombuffer(matrix_bytes, dtype=np.float32).reshape(shape)

        # 1. PCA: Reduce 25 feature rows down to top 3 components to prevent OOM
        pca = PCA(n_components=3)
        # transpose so features are columns for PCA, then transpose back
        reduced_matrix = pca.fit_transform(matrix.T).T

        # We need a 1D time series for TakensEmbedding or we can embed multivariate directly.
        # TopoAcoustic doc: "phase space without self intersection"
        # We can just take the first principal component for Takens embedding to simplify and avoid combinatorial explosion.
        time_series = reduced_matrix[0]

        # 2. Takens' Embedding
        # In a real app we'd calculate optimal tau and d, here we'll use sensible defaults or gtda's built-in heuristics
        # SingleTakensEmbedding parameters can be optimized
        embedder = SingleTakensEmbedding(
            parameters_type="search", time_delay=1, dimension=3
        )
        point_cloud = embedder.fit_transform(time_series)

        # Subsample point cloud to avoid factorial complexity explosion (OOM)
        # We limit to 200 points
        if len(point_cloud) > 200:
            indices = np.linspace(0, len(point_cloud)-1, 200, dtype=int)
            point_cloud = point_cloud[indices]

        # reshape for VR persistence (n_samples, n_points, n_dimensions)
        point_cloud_batch = point_cloud[None, :, :]

        # 3. Simplicial Complex Construction & Homology
        # Homology dimensions H0, H1, H2
        vr = VietorisRipsPersistence(homology_dimensions=[0, 1, 2], max_edge_length=5.0)
        diagrams = vr.fit_transform(point_cloud_batch)

        # 4. Vectorization (Persistence Landscapes)
        # Create 1500-d vector. 3 homology dims * n_layers * n_bins = 1500
        # For instance, 3 homology dims * 10 layers * 50 bins = 1500
        landscape = PersistenceLandscape(n_layers=10, n_bins=50)
        landscape_features = landscape.fit_transform(diagrams)

        # Flatten and ensure float32
        vector = landscape_features.flatten().astype(np.float32)

        # Ensure exactly 1500 dimensions
        if vector.shape[0] > 1500:
            vector = vector[:1500]
        elif vector.shape[0] < 1500:
            pad = np.zeros(1500 - vector.shape[0], dtype=np.float32)
            vector = np.concatenate((vector, pad))

        # Calculate Betti summaries
        # diagrams shape is (1, n_features, 3) where last axis is [birth, death, dimension]
        h0_diagram = diagrams[0][diagrams[0][:, 2] == 0]
        h1_diagram = diagrams[0][diagrams[0][:, 2] == 1]
        h2_diagram = diagrams[0][diagrams[0][:, 2] == 2]

        h0_persistence = h0_diagram[:, 1] - h0_diagram[:, 0] if len(h0_diagram) > 0 else np.array([])
        h0_max = float(np.max(h0_persistence[~np.isinf(h0_persistence)]) if len(h0_persistence[~np.isinf(h0_persistence)]) > 0 else 0)

        h1_cycle_count = len(h1_diagram)

        h2_persistence = h2_diagram[:, 1] - h2_diagram[:, 0] if len(h2_diagram) > 0 else np.array([])
        h2_void_volume = float(np.sum(h2_persistence[~np.isinf(h2_persistence)]) if len(h2_persistence) > 0 else 0)

        compute_time_ms = int((time.time() - start_time) * 1000)

        result = {
            "spotify_track_id": payload.get("spotify_track_id"),
            "metadata": payload.get("metadata"),
            "topological_signature": {
                "dimensions": len(vector),
                "vector": vector.tolist()
            },
            "betti_summaries": {
                "h0_max_persistence": h0_max,
                "h1_cycle_count": h1_cycle_count,
                "h2_void_volume": h2_void_volume
            },
            "compute_time_ms": compute_time_ms
        }

        return result

    except Exception as e:
        return {"status": "failed", "reason": str(e)}
