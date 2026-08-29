from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.config import PROJECT_NAME, ENV
from app.routes.career import router as career_router
from app.routes.students import router as students_router
from app.routes.progress import router as progress_router
from app.routes.gap_analyzer import router as gap_analyzer_router
from app.routes.ai import router as ai_router
from app.routes.recommender import router as recommender_router

from app.utils.firebase import init_firebase_app

app = FastAPI(
    title=PROJECT_NAME,
    description="LevelUP – AI-powered career path & learning roadmap agent",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    init_firebase_app()

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://level-up-new.vercel.app",
    "https://levelup-new-backend.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(career_router)
app.include_router(students_router)
app.include_router(progress_router)
app.include_router(gap_analyzer_router)
app.include_router(ai_router)
app.include_router(recommender_router)

@app.get("/")
def root():
    return {
        "app": PROJECT_NAME,
        "env": ENV,
        "status": "running"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

