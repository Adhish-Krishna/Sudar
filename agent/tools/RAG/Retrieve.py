from langchain_huggingface import HuggingFaceEmbeddings
import os
from datetime import datetime
from ...utils.util import extract_filename
from rich.console import Console
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue
from envconfig import QDRANT_URL
from ...utils import getUserIdChatId
console = Console()

class RetrieveChunks:
  def __init__(self, object_key: str, query: str):
    try:
      self.query = query
      self.user_id , self.chat_id = getUserIdChatId()
      self.client = QdrantClient(url= QDRANT_URL)
      self.object_key: str = object_key
      self.filename: str = extract_filename(object_key)
      self.current_dir = os.path.dirname(os.path.abspath(__file__))
    except Exception as e:
      console.print(f"Error during initialization: {str(e)}", style="red")
      raise

  def retrieveChunks(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2")->list:
    try:
      # Check if the collection exists in Qdrant
      if not self.client.collection_exists(collection_name="sudar-ai"):
        console.print("Vector DB collection 'sudar-ai' does not exist!", style="red")
        return []

      embeddings = HuggingFaceEmbeddings(model_name=model_name)
      chunks = []
      console.print("Retrieving Context...", style="orange3")
      st = datetime.now()
      try:
        # Create filters for user_id and chat_id
        query_filter = Filter(
          must=[
            FieldCondition(
              key="user_id",
              match=MatchValue(value=self.user_id)
            ),
            FieldCondition(
              key="chat_id", 
              match=MatchValue(value=self.chat_id)
            )
          ]
        )
        
        # Filter out the retrieval based on user_id and chat_id
        hits = self.client.query_points(
          collection_name="sudar-ai",
          query=embeddings.embed_query(self.query),
          limit=5,  # no of nearest neighbors
          query_filter=query_filter 
        ).points
      except Exception as e:
        console.print(f"Error during similarity search: {str(e)}", style="red")
        return []
      
      et = datetime.now()
      run_time = et - st
      console.print("Context Retrieved", style="orange3")
      console.print(f"Time Taken: {str(run_time)}", style="orange3")

      for hit in hits:
        chunks.append(hit.payload)

      console.print(f"Chunks Retrieved: {str(len(chunks))}", style="orange3")
      return chunks

    except Exception as e:
      console.print(f"Error in retrieveChunks: {str(e)}", style="red")
      return []