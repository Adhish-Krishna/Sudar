from langchain_docling.loader import ExportType
from langchain_docling.loader import DoclingLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores.utils import filter_complex_metadata
from datetime import datetime
from ...utils.util import extract_filename, extract_extension
from rich.console import Console
import os
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from dotenv import load_dotenv
import uuid

# Create console instance at class level
console = Console()

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")

class ChunkDocument:

  def __init__(self, filepath: str, user_id: str = "teacher001", chat_id: str = "1"):
    try:
      self.user_id = user_id
      self.chat_id = chat_id
      self.client = QdrantClient(url=QDRANT_URL)
      #creating a collection if it does not exits
      if(self.client.collection_exists(collection_name="sudar-ai")==False):
        self.client.create_collection(
          collection_name="sudar-ai",
          vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )
      self.filepath: str = filepath
      self.filename: str = extract_filename(filepath)
      self.extension: str = extract_extension(filepath)
      self.current_dir = os.path.dirname(os.path.abspath(__file__))
    except Exception as e:
      console.print(f"Error during initialization: {str(e)}", style="red")
      raise

  def parseDocument(self):
    try:
      console.print("Initializing Vector DB...", style="blue")
      if not os.path.exists(self.filepath):
        console.print(f"Error: The document {self.filepath} does not exist!", style="red")
        raise FileNotFoundError(f"The document {self.filepath} does not exist!")

      console.print("Loading the document...", style="blue")
      st = datetime.now()
      loader = DoclingLoader(file_path=self.filepath, export_type=ExportType.DOC_CHUNKS)
      self.docs = loader.load()
      et = datetime.now()
      run_time = et - st
      console.print("Document Loaded", style="blue")
      console.print(f"Time Taken: {str(run_time)}", style="blue")
      console.print(f"Number of Chunks: {str(len(self.docs))}", style="blue")
    except FileNotFoundError as e:
      console.print(f"File Error: {str(e)}", style="red")
      raise
    except Exception as e:
      console.print(f"Error during document parsing: {str(e)}", style="red")
      raise

  def initializeEmbeddings(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2")->None:
    try:
      console.print("Initializing Embeddings", style="green")
      st = datetime.now()
      self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
      et = datetime.now()
      run_time = et - st
      console.print("Initialized Embeddings", style="green")
      console.print(f"Time Taken: {str(run_time)}", style="green")
    except Exception as e:
      console.print(f"Error initializing embeddings: {str(e)}", style="red")
      raise

  def storeEmbeddings(self)->None:
    try:
      console.print("Creating Vector DB", style="yellow")
      st = datetime.now()
      filtered_documents =filter_complex_metadata(self.docs)
      self.client.upload_points(
        collection_name="sudar-ai",
        points=[
          PointStruct(
          id=str(uuid.uuid4()),
          vector=self.embeddings.embed_query(docs.page_content),
          payload={
            "filepath":docs.metadata['source'],
            "content": docs.page_content,
            "user_id": self.user_id, #sample user_id
            "chat_id": self.chat_id, #sample chat_id
          }
          ) for docs in filtered_documents
        ]
      )
      et = datetime.now()
      run_time = et - st
      console.print("Finished Creating Vector DB", style="yellow")
      console.print(f"Time Taken: {str(run_time)}", style="yellow")
    except Exception as e:
      console.print(f"Error storing embeddings: {str(e)}", style="red")
      raise