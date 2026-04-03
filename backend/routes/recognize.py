from fastapi import APIRouter, UploadFile, File
from backend.utils.image import preprocess_image
from backend.services.clip_service import encode_image
from backend.services.pipeline import recognize_place

router = APIRouter()


@router.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    image = preprocess_image(file.file)
    vector = encode_image(image)
    result = recognize_place(vector)
    return result