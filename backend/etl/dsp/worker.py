import os
import base64
from datetime import datetime, timezone
import librosa
import pywt
import numpy as np
from scipy import stats
from celery import Celery

app = Celery('dsp', broker='redis://localhost:6379/0')

@app.task(name='dsp.extract_features', bind=True)
def extract_features(self, payload):
    local_audio_path = payload.get('local_audio_path')
    if not local_audio_path or not os.path.exists(local_audio_path):
        return {"status": "failed", "reason": "audio file missing"}

    try:
        y, sr = librosa.load(local_audio_path, sr=22050, mono=True, duration=30)
        y, _ = librosa.effects.trim(y)

        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)

        coeffs = pywt.wavedec(y, 'db4', level=3)
        wavelet_features = []
        # Calculate RMS energy for each band across frames
        # To match the time dimension (T) of MFCC and spectral centroid
        hop_length = 512
        frames = range(0, len(y), hop_length)

        for coeff in coeffs[:4]: # Using 4 structural bands as specified
            # Resample wavelet coefficients to match frame rate of mfcc
            # A simple approach is to calculate energy in windows
            # Or simpler: just resize/interpolate to match T
            # But wait, T is mfcc.shape[1]
            T = mfcc.shape[1]
            # interpolate coefficient array to size T
            interpolated = np.interp(np.linspace(0, len(coeff), T), np.arange(len(coeff)), coeff)
            wavelet_features.append(interpolated)

        wavelet_matrix = np.array(wavelet_features)

        # Stack all features: 20 MFCCs + 1 Spectral Centroid + 4 Wavelet = 25 features
        matrix = np.vstack([mfcc, spectral_centroid, wavelet_matrix])

        # Z-score normalization for each feature row independently
        matrix = stats.zscore(matrix, axis=1)

        if np.isnan(matrix).any():
            raise ValueError("NaN generation during normalization")

        if matrix.shape[1] < 500:
            raise ValueError("Insufficient Audio Length (T < 500)")

        # Serialize
        matrix_bytes = matrix.astype(np.float32).tobytes()
        encoded_data = base64.b64encode(matrix_bytes).decode('utf-8')

        result = {
            "spotify_track_id": payload.get('spotify_track_id'),
            "metadata": payload.get('metadata'),
            "dsp_matrix": {
                "shape": list(matrix.shape),
                "data": encoded_data
            },
            "extraction_timestamp": datetime.now(timezone.utc).isoformat()
        }

        # Egress & Cleanup
        os.remove(local_audio_path)

        # Chain to Topology Engine
        app.send_task('topology.extract_topology', args=[result])

        return {"status": "success", "track_id": payload.get('spotify_track_id')}

    except Exception as e:
        if os.path.exists(local_audio_path):
            os.remove(local_audio_path)
        return {"status": "failed", "reason": str(e)}
