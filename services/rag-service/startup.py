"""
Startup script to check Ollama availability, initialize Docling models, and start the service
"""
import os
import sys
import time
import requests
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(name)s - %(message)s'
)
logger = logging.getLogger(__name__)


def initialize_docling_models():
    """
    Initialize Docling models on first startup.
    
    Models are downloaded and cached in the directory specified by DOCLING_ARTIFACTS_PATH.
    This ensures models persist across container restarts via Docker volumes.
    
    Returns:
        bool: True if initialization successful or already cached, False otherwise
    """
    try:
        logger.info("Initializing Docling models...")
        
        from docling.datamodel.settings import settings
        from docling.utils.model_downloader import download_models
        
        # Get artifacts path from environment or use default
        artifacts_path = os.getenv('DOCLING_ARTIFACTS_PATH')
        if artifacts_path:
            artifacts_path = Path(artifacts_path)
        else:
            artifacts_path = settings.cache_dir / "models"
        
        logger.info(f"Models cache directory: {artifacts_path}")
        
        # Ensure directory exists
        artifacts_path.mkdir(parents=True, exist_ok=True)
        
        # Check if models are already downloaded
        # Look for layout model as an indicator that models exist
        layout_marker = artifacts_path / "ds4sd--docling-layout-heron" / "layout_model.pt"
        
        if layout_marker.exists():
            logger.info("✓ Docling models already cached, skipping download")
            return True
        
        logger.info("Downloading Docling models (this may take a few minutes on first startup)...")
        logger.info("  - Layout model (Heron)")
        logger.info("  - TableFormer (table structure)")
        logger.info("  - Code & Formula model")
        logger.info("  - Picture Classifier")
        logger.info("  - RapidOCR (detection & recognition)")
        
        # Download models
        download_models(
            output_dir=artifacts_path,
            force=False,
            progress=True,
            with_layout=True,
            with_tableformer=True,
            with_code_formula=True,
            with_picture_classifier=True,
            with_rapidocr=True,
            with_easyocr=False,
            with_smolvlm=False,
            with_granitedocling=False,
            with_granitedocling_mlx=False,
            with_smoldocling=False,
            with_smoldocling_mlx=False,
            with_granite_vision=False,
        )
        
        logger.info(f"✓ Docling models successfully initialized in {artifacts_path}")
        return True
        
    except Exception as e:
        logger.error(f"✗ Failed to initialize Docling models: {str(e)}", exc_info=True)
        logger.warning("  Service will start but document parsing may fail!")
        return False  # Don't fail startup, let service start


def check_ollama_connection(max_retries=5, retry_delay=5):
    """
    Check if Ollama service is available.
    
    Args:
        max_retries: Maximum number of connection attempts
        retry_delay: Delay between retries in seconds
    
    Returns:
        bool: True if Ollama is available, False otherwise
    """
    ollama_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
    
    print(f"Checking Ollama connection at {ollama_url}...")
    
    for attempt in range(1, max_retries + 1):
        try:
            # Try to connect to Ollama's tags endpoint
            response = requests.get(f"{ollama_url}/api/tags", timeout=5)
            
            if response.status_code == 200:
                print(f"✓ Ollama is available at {ollama_url}")
                
                # Check if the required embedding model is available
                embedding_model = os.getenv('EMBEDDING_MODEL_NAME', 'nomic-embed-text')
                models_data = response.json()
                available_models = [model['name'] for model in models_data.get('models', [])]
                
                if any(embedding_model in model for model in available_models):
                    print(f"✓ Embedding model '{embedding_model}' is available")
                    return True
                else:
                    print(f"⚠ Warning: Embedding model '{embedding_model}' not found")
                    print(f"  Available models: {available_models}")
                    print(f"  Please run: ollama pull {embedding_model}")
                    print("  Service will start but embeddings may fail!")
                    return True  # Still return True to allow service to start
                    
        except requests.exceptions.RequestException as e:
            print(f"✗ Attempt {attempt}/{max_retries}: Ollama not available - {e}")
            
            if attempt < max_retries:
                print(f"  Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print(f"\n✗ Failed to connect to Ollama after {max_retries} attempts")
                print(f"  Please ensure Ollama is running at {ollama_url}")
                return False
    
    return False


def check_qdrant_connection(max_retries=5, retry_delay=5):
    """
    Check if Qdrant service is available.
    
    Args:
        max_retries: Maximum number of connection attempts
        retry_delay: Delay between retries in seconds
    
    Returns:
        bool: True if Qdrant is available, False otherwise
    """
    qdrant_host = os.getenv('QDRANT_HOST', 'localhost')
    qdrant_port = os.getenv('QDRANT_PORT', '6333')
    qdrant_url = f"http://{qdrant_host}:{qdrant_port}"
    
    print(f"\nChecking Qdrant connection at {qdrant_url}...")
    
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(f"{qdrant_url}/", timeout=5)
            
            if response.status_code == 200:
                print(f"✓ Qdrant is available at {qdrant_url}")
                return True
                
        except requests.exceptions.RequestException as e:
            print(f"✗ Attempt {attempt}/{max_retries}: Qdrant not available - {e}")
            
            if attempt < max_retries:
                print(f"  Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print(f"\n✗ Failed to connect to Qdrant after {max_retries} attempts")
                print(f"  Please ensure Qdrant is running at {qdrant_url}")
                return False
    
    return False


def start_service():
    """Start the FastAPI service."""
    print("\n" + "=" * 60)
    print("Starting RAG Microservice...")
    print("=" * 60 + "\n")
    
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run("main:app", host=host, port=port, reload=False)


def main():
    """Main startup function."""
    print("=" * 60)
    print("RAG Microservice - Startup Check")
    print("=" * 60)
    
    # Initialize Docling models on first startup
    # This downloads models to the Docker volume if not already cached
    print("\n" + "=" * 60)
    print("Step 1: Initialize Docling Models")
    print("=" * 60)
    initialize_docling_models()
    
    # Check Qdrant connection
    print("\n" + "=" * 60)
    print("Step 2: Check Qdrant Connection")
    print("=" * 60)
    qdrant_ok = check_qdrant_connection()
    
    # Check Ollama connection
    print("\n" + "=" * 60)
    print("Step 3: Check Ollama Connection")
    print("=" * 60)
    ollama_ok = check_ollama_connection()
    
    # Decide whether to start the service
    if not qdrant_ok:
        print("\n✗ Cannot start service: Qdrant is not available")
        sys.exit(1)
    
    if not ollama_ok:
        print("\n⚠ Warning: Ollama is not available")
        print("  Service will start but embedding operations will fail!")
        response = input("Do you want to start anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Start the service
    start_service()


if __name__ == "__main__":
    main()
