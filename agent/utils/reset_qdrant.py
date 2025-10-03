"""
Utility script to reset Qdrant collections with correct embedding dimensions
Run this when you change embedding models or need to clear memory
"""
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def reset_qdrant_collections(
    host: str = "localhost",
    port: int = 6333,
    embedding_dimension: int = 768  # embeddinggemma:300m dimension
):
    """
    Reset Qdrant collections with correct embedding dimensions
    
    Args:
        host: Qdrant host
        port: Qdrant port
        embedding_dimension: Dimension of embedding vectors (768 for embeddinggemma:300m)
    """
    try:
        # Connect to Qdrant
        client = QdrantClient(host=host, port=port)
        logger.info(f"Connected to Qdrant at {host}:{port}")
        
        # Collections used by Mem0
        collections = ["mem0", "mem0migrations"]
        
        for collection_name in collections:
            # Check if collection exists
            try:
                collection_info = client.get_collection(collection_name)
                logger.info(f"Collection '{collection_name}' exists with dimension: {collection_info.config.params.vectors.size}")
                
                # Delete existing collection
                client.delete_collection(collection_name)
                logger.info(f"Deleted collection: {collection_name}")
            except Exception as e:
                logger.info(f"Collection '{collection_name}' does not exist (will create new)")
            
            # Create collection with correct dimensions
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=embedding_dimension,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Created collection '{collection_name}' with dimension: {embedding_dimension}")
        
        logger.info("✅ Qdrant collections reset successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to reset Qdrant collections: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Qdrant Collection Reset Utility")
    print("=" * 60)
    print("\nThis will DELETE all existing memories and recreate collections")
    print("with the correct embedding dimensions for embeddinggemma:300m (768)")
    print("\n⚠️  WARNING: All existing conversation memories will be lost!")
    
    response = input("\nContinue? (yes/no): ").strip().lower()
    
    if response == "yes":
        print("\nResetting Qdrant collections...")
        success = reset_qdrant_collections()
        if success:
            print("\n✅ Done! You can now use the agent with embeddinggemma:300m")
        else:
            print("\n❌ Failed to reset collections. Check the logs above.")
    else:
        print("\nOperation cancelled.")
