from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .auth import router as auth_router
from .classroom import router as classroom_router
from .students import router as students_router
from .subjects import router as subjects_router
from .activity import router as activity_router
from .performance import router as performance_router
import uvicorn
from dotenv import load_dotenv
import os

load_dotenv()

PORT = os.getenv("PORT")

app = FastAPI(
    title="Sudar API",
    description="Backend API for Sudar Educational Platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(classroom_router)
app.include_router(students_router)
app.include_router(subjects_router)
app.include_router(activity_router)
app.include_router(performance_router)


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


