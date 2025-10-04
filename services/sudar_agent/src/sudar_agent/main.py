#!/usr/bin/env python
"""Main entry point for Sudar Agent Service."""

import sys


def run():
    """
    Run a test query through the agent system.
    For actual usage, use the 'serve' command to start the API server.
    """
    print("Note: This service is designed to run as an API server.")
    print("To start the server, run: uv run serve")
    print("\nFor testing, you can use the API endpoints:")
    print("  POST http://localhost:3005/api/chat")
    print("  POST http://localhost:3005/api/chat/sync")


def train():
    """Train command - not applicable for this service."""
    print("Training is not applicable for this service architecture.")
    print("The service uses pre-configured flows and agents.")


def replay():
    """Replay command - not applicable for this service."""
    print("Replay is not applicable for this service architecture.")
    print("Check MongoDB chat history for previous conversations.")


def test():
    """Test the service by running a sample query."""
    print("To test the service:")
    print("1. Start the server: uv run serve")
    print("2. Send a POST request to http://localhost:3005/api/chat/sync")
    print("3. Example payload:")
    print("""
    {
        "user_id": "test_user",
        "chat_id": "test_chat",
        "query": "Explain photosynthesis"
    }
    """)


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
