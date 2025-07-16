from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import services

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(services.router)

@app.get("/healthz")
def health():
    return {"status": "ok"}