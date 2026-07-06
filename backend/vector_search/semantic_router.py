import numpy as np
import re
from typing import Dict, List, Any

class SemanticRouter:
    def __init__(self, dim: int = 1500):
        self.dim = dim

        # In a real system, these would be sophisticated baseline vectors
        # For now, we use deterministic random vectors for different features
        np.random.seed(42)
        self.baselines = {
            "timbral_density_h0": np.random.rand(self.dim),
            "cyclic_frequency_h1": np.random.rand(self.dim),
            "spectral_brightness": np.random.rand(self.dim),
            "transient_sharpness": np.random.rand(self.dim)
        }

    def sanitize(self, text: str) -> str:
        """Strips special characters and limits to 250 characters."""
        # Remove anything that isn't alphanumeric or whitespace
        text = re.sub(r'[^\w\s]', '', text)
        # Enforce 250 character limit
        return text[:250].strip()

    def parse_semantics(self, text: str) -> Dict[str, float]:
        """
        Simulates an LLM parsing natural language into normalized acoustic weights.
        Returns a dictionary mapping acoustic axes to values in [0.0, 1.0].
        """
        sanitized_text = self.sanitize(text).lower()

        # Default neutral weights
        weights = {
            "timbral_density_h0": 0.5,
            "cyclic_frequency_h1": 0.5,
            "spectral_brightness": 0.5,
            "transient_sharpness": 0.5
        }

        # Extremely basic dummy keyword matching
        if "dark" in sanitized_text:
            weights["spectral_brightness"] = max(0.0, weights["spectral_brightness"] - 0.3)
        if "heavy" in sanitized_text:
            weights["timbral_density_h0"] = min(1.0, weights["timbral_density_h0"] + 0.3)
        if "repetitive" in sanitized_text or "rhythmic" in sanitized_text:
            weights["cyclic_frequency_h1"] = min(1.0, weights["cyclic_frequency_h1"] + 0.3)
        if "sharp" in sanitized_text:
            weights["transient_sharpness"] = min(1.0, weights["transient_sharpness"] + 0.3)

        if "chaos" in sanitized_text:
             weights["cyclic_frequency_h1"] = 0.95

        if "silence" in sanitized_text:
             weights["timbral_density_h0"] = 0.05

        return weights

    def synthesize_vector(self, weights: Dict[str, float]) -> List[float]:
        """
        Blends baseline vectors based on the provided weights.
        Returns a 1500-dimensional list of floats.
        """
        result = np.zeros(self.dim)

        for key, weight in weights.items():
            if key in self.baselines:
                # Simple linear combination for dummy implementation
                result += self.baselines[key] * weight

        # Normalize the resulting vector
        norm = np.linalg.norm(result)
        if norm > 0:
            result = result / norm

        return result.tolist()

    def process_prompt(self, text: str) -> Dict[str, Any]:
        """End-to-end processing of a text prompt."""
        weights = self.parse_semantics(text)
        target_vector = self.synthesize_vector(weights)
        return {
            "interpreted_parameters": weights,
            "target_vector": target_vector
        }
