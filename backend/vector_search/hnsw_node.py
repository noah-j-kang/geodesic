import hnswlib
import json
import os
import numpy as np
from typing import List, Dict, Tuple

class HNSWNode:
    def __init__(self, dim: int = 1500, max_elements: int = 50000, index_path: str = "index_snapshot.bin", id_map_path: str = "id_map.json"):
        self.dim = dim
        self.max_elements = max_elements
        self.index_path = index_path
        self.id_map_path = id_map_path

        self.index = hnswlib.Index(space='l2', dim=self.dim)
        self.id_to_str: Dict[int, str] = {}
        self.str_to_id: Dict[str, int] = {}
        self.current_id = 0

        # Initialize an empty index or load from snapshot if exists
        self.index.init_index(max_elements=self.max_elements, ef_construction=200, M=16)
        self.rehydrate()

    def add_item(self, track_id: str, vector: List[float]) -> None:
        """Adds a 1500-d vector to the HNSW index."""
        if track_id in self.str_to_id:
            return  # Already exists

        int_id = self.current_id
        self.current_id += 1

        self.id_to_str[int_id] = track_id
        self.str_to_id[track_id] = int_id

        self.index.add_items(np.array([vector], dtype=np.float32), np.array([int_id]))

    def query(self, target_vector: List[float], k: int = 20) -> List[Tuple[str, float]]:
        """Queries the index for the k nearest neighbors."""
        if self.current_id == 0:
            return []

        k = min(k, self.current_id)
        labels, distances = self.index.knn_query(np.array([target_vector], dtype=np.float32), k=k)

        results = []
        for label, distance in zip(labels[0], distances[0]):
            results.append((self.id_to_str[label], float(distance)))

        return results

    def snapshot(self) -> None:
        """Serializes the index and ID map to disk."""
        self.index.save_index(self.index_path)
        with open(self.id_map_path, 'w') as f:
            json.dump({
                "id_to_str": self.id_to_str,
                "current_id": self.current_id
            }, f)

    def rehydrate(self) -> None:
        """Loads the index and ID map from disk if they exist."""
        if os.path.exists(self.index_path) and os.path.exists(self.id_map_path):
            try:
                self.index.load_index(self.index_path, max_elements=self.max_elements)
                with open(self.id_map_path, 'r') as f:
                    data = json.load(f)
                    # JSON keys are strings, convert back to int
                    self.id_to_str = {int(k): v for k, v in data.get("id_to_str", {}).items()}
                    self.str_to_id = {v: int(k) for k, v in data.get("id_to_str", {}).items()}
                    self.current_id = data.get("current_id", 0)
            except Exception as e:
                print(f"Failed to rehydrate index: {e}")
                # Reset state if load fails
                self.index.init_index(max_elements=self.max_elements, ef_construction=200, M=16)
                self.id_to_str = {}
                self.str_to_id = {}
                self.current_id = 0
