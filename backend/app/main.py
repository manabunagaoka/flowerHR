from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import skill_router

app = FastAPI(title="flowerHR API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(skill_router.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "flowerHR running"}
