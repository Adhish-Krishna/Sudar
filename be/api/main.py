from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .auth import router as auth_router
from .classroom import router as classroom_router
from .students import router as students_router
from .subjects import router as subjects_router
from .activity import router as activity_router
from .performance import router as performance_router
from .minio import router as minio_router
import uvicorn
from dotenv import load_dotenv
import os

load_dotenv()

PORT = os.getenv("PORT")
FRONTEND_URL = os.getenv("FRONTEND_URL")

app = FastAPI(
    title="Sudar API",
    description="Backend API for Sudar Educational Platform",
    version="1.0.0",
    root_path="/api"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(classroom_router)
app.include_router(students_router)
app.include_router(subjects_router)
app.include_router(activity_router)
app.include_router(performance_router)
app.include_router(minio_router)


@app.get("/", tags=["Root"])
def read_root():
    """
    Root endpoint - API health check
    """
    return {
        "message": "Welcome to Sudar API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy"}

def main():
    uvicorn.run("api.main:app", host="0.0.0.0", port=int(PORT), reload=True)

if __name__ == "__main__":
    main()


