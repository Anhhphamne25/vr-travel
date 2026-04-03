from collections import Counter
from backend.app.services.vector_store import search


def recognize_place(vector):
    results = search(vector, top_k=5)

    places = [r["place"] for r in results]

    best_place = Counter(places).most_common(1)[0][0]

    best_score = max(
        r["score"] for r in results if r["place"] == best_place
    )

    if best_score < 0.5:
        return {"place": "unknown", "score": best_score}

    return {"place": best_place, "score": best_score}