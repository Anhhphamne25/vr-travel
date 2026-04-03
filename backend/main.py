import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.recognize import router as recognize_router
from backend.routes.place import router as place_router

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_PATH = os.path.abspath(os.path.join(BASE_DIR, "../frontend"))
DATA_PATH = os.path.abspath(os.path.join(BASE_DIR, "../data"))


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recognize_router)
app.include_router(place_router)

app.mount("/static", StaticFiles(directory=DATA_PATH), name="static")

app.mount(
    "/",
    StaticFiles(directory=FRONTEND_PATH, html=True),
    name="frontend"
)