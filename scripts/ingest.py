import os
import numpy as np
from PIL import Image
from backend.app.services.clip_service import encode_image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "places")

all_vectors = []
all_places = []

for place in os.listdir(DATA_DIR):
    place_path = os.path.join(DATA_DIR, place)

    for img_name in os.listdir(place_path):
        img_path = os.path.join(place_path, img_name)

        image = Image.open(img_path).convert("RGB")
        vector = encode_image(image)

        all_vectors.append(vector)
        all_places.append(place)

vectors = np.array(all_vectors)

np.save("../data/vectors.npy", {
    "vectors": vectors,
    "places": all_places
})

print("Ingest done!")