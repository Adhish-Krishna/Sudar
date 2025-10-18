"""
Initialize Docling models on first startup.

This script downloads and caches Docling's detection and recognition models
in a Docker volume. Models are downloaded only once and persist across container restarts.

Reference: https://github.com/docling-project/docling
"""

import logging
import sys
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(name)s - %(message)s'
)
logger = logging.getLogger(__name__)


def initialize_docling_models():
    """
    Download and cache Docling models.
    
    Models are downloaded to the directory specified by DOCLING_ARTIFACTS_PATH
    environment variable. If not set, defaults to ~/.cache/docling/models.
    
    This ensures models are cached and reused across container restarts.
    """
    try:
        # Import Docling utilities
        from docling.datamodel.settings import settings
        from docling.utils.model_downloader import download_models
        
        logger.info("Initializing Docling models...")
        
        # Get the artifacts path (cache directory for models)
        # This will be /docling_models (Docker volume mount)
        artifacts_path = Path(settings.artifacts_path) if settings.artifacts_path else None
        
        if artifacts_path is None:
            logger.warning(
                "DOCLING_ARTIFACTS_PATH not set, using default cache directory: "
                f"{settings.cache_dir / 'models'}"
            )
            artifacts_path = settings.cache_dir / "models"
        
        logger.info(f"Models cache directory: {artifacts_path}")
        
        # Ensure directory exists
        artifacts_path.mkdir(parents=True, exist_ok=True)
        
        # Download default models
        # These include: layout model, tableformer, code_formula, picture_classifier, rapidocr
        logger.info("Downloading default Docling models...")
        logger.info("  - Layout model (Heron)")
        logger.info("  - TableFormer (table structure)")
        logger.info("  - Code & Formula model")
        logger.info("  - Picture Classifier")
        logger.info("  - RapidOCR (detection & recognition)")
        
        download_models(
            output_dir=artifacts_path,
            force=False,  # Don't re-download if already present
            progress=True,  # Show download progress
            with_layout=True,
            with_tableformer=True,
            with_code_formula=True,
            with_picture_classifier=True,
            with_rapidocr=True,
            with_easyocr=False,  # Optional, disabled by default
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
        return False


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("Docling Model Initialization")
    logger.info("=" * 60)
    
    success = initialize_docling_models()
    
    if success:
        logger.info("=" * 60)
        logger.info("Initialization completed successfully!")
        logger.info("=" * 60)
        sys.exit(0)
    else:
        logger.error("=" * 60)
        logger.error("Initialization failed!")
        logger.error("=" * 60)
        sys.exit(1)
