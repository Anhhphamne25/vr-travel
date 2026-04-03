import os
from fastapi import APIRouter

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE_PATH = os.path.join(BASE_DIR, "data", "vr")

FACES = ["px", "nx", "py", "ny", "pz", "nz"]


def _find_ext(folder: str, face: str) -> str | None:
    """Tìm extension thực tế của file (jpg hoặc jpeg)."""
    for ext in ("jpg", "jpeg"):
        if os.path.exists(os.path.join(folder, f"{face}.{ext}")):
            return ext
    return None


@router.get("/place/{place}")
def get_place(place: str):
    folder = os.path.join(BASE_PATH, place)

    if not os.path.exists(folder):
        return {"error": "not found"}

    images = []
    for face in FACES:
        ext = _find_ext(folder, face)
        if ext is None:
            return {"error": f"missing face: {face}"}
        images.append(f"/static/vr/{place}/{face}.{ext}")

    return {
        "type": "cubemap",
        "images": images,
    }