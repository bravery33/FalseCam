from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import services
from fastapi.staticfiles import StaticFiles
from api.services import router

app = FastAPI()

app.mount("/media", StaticFiles(directory="user_media"), name="media")
app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://falsecam.pages.dev"
        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(services.router)

@app.get("/healthz")
def health():
    return {"status": "ok"}