import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VECTOR_PATH = os.path.join(BASE_DIR, "data", "vectors.npy")

print("Loading vectors from:", VECTOR_PATH)

data = np.load(VECTOR_PATH, allow_pickle=True).item()

vectors = data["vectors"]
places = data["places"]


def search(query_vector, top_k=5):
    sims = np.dot(vectors, query_vector)

    top_indices = np.argsort(sims)[-top_k:][::-1]

    results = []
    for idx in top_indices:
        results.append({
            "place": places[idx],
            "score": float(sims[idx])
        })

    return results