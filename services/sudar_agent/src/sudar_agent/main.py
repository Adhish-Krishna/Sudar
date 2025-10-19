#!/usr/bin/env python
"""Main entry point for Sudar Agent Service."""

def serve():
    """Run the FastAPI server."""
    import uvicorn
    from .config.config import config
    
    print(f"Starting Sudar Agent Service on {config.HOST}:{config.PORT}")
    print(f"Model Provider: {config.MODEL_PROVIDER}")
    
    uvicorn.run(
        "sudar_agent.api:app",
        host=config.HOST,
        port=config.PORT,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    serve()
