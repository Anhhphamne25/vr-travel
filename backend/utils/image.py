from PIL import Image


def preprocess_image(file):
    image = Image.open(file).convert("RGB")
    image = image.resize((224, 224))
    return image