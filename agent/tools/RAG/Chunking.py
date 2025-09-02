from langchain_docling.loader import ExportType
from langchain_docling.loader import DoclingLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_community.vectorstores.utils import filter_complex_metadata
from datetime import datetime
from utils.util import sanitize_collection_name, extract_filename, extract_extension
from rich.console import Console
import os

# Create console instance at class level
console = Console()

class ChunkDocument:

  def __init__(self, filepath: str):
    try:
      self.filepath: str = filepath
      self.filename: str = extract_filename(filepath)
      self.extension: str = extract_extension(filepath)
      self.collection_name: str = sanitize_collection_name(self.filename)
      self.current_dir = os.path.dirname(os.path.abspath(__file__))
      self.persistant_dir = os.path.join(self.current_dir,"db", self.filename)
      self.isExist: bool = False
    except Exception as e:
      console.print(f"Error during initialization: {str(e)}", style="red")
      raise

  def parseDocument(self)->bool:
    try:
      if not os.path.exists(self.persistant_dir):
        self.isExist = False
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
      else:
        console.print("Vector DB already exists", style="green")
        self.isExist = True
      return self.isExist
    except FileNotFoundError as e:
      console.print(f"File Error: {str(e)}", style="red")
      raise
    except Exception as e:
      console.print(f"Error during document parsing: {str(e)}", style="red")
      raise

  def initializeEmbeddings(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2")->None:
    try:
      if self.isExist == False:
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
      if self.isExist == False:
        console.print("Creating Vector DB", style="yellow")
        st = datetime.now()
        vector_store = Chroma(
          collection_name=self.collection_name,
          embedding_function=self.embeddings,
          persist_directory=self.persistant_dir
        )
        vector_store.add_documents(filter_complex_metadata(self.docs))
        et = datetime.now()
        run_time = et - st
        console.print("Finished Creating Vector DB", style="yellow")
        console.print(f"Time Taken: {str(run_time)}", style="yellow")
    except Exception as e:
      console.print(f"Error storing embeddings: {str(e)}", style="red")
      raise