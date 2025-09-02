from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import os
from datetime import datetime
from utils.util import sanitize_collection_name, extract_filename
from rich.console import Console

console = Console()

class RetrieveChunks:
  def __init__(self, filepath: str, query: str):
    try:
      self.query = query
      self.filepath: str = filepath
      self.filename: str = extract_filename(filepath)
      self.collection_name: str = sanitize_collection_name(self.filename)
      self.current_dir = os.path.dirname(os.path.abspath(__file__))
      self.persistant_dir = os.path.join(self.current_dir,"db", self.filename)
    except Exception as e:
      console.print(f"Error during initialization: {str(e)}", style="red")
      raise

  def retrieveChunks(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2")->list:
    try:
      if not os.path.exists(self.persistant_dir):
        console.print("Vector DB is not created!", style="red")
        return []

      embeddings = HuggingFaceEmbeddings(model_name=model_name)
      vector_store = Chroma(
        collection_name=self.collection_name,
        embedding_function=embeddings,
        persist_directory=self.persistant_dir
      )

      chunks = []
      console.print("Retrieving Context...", style="orange3")
      st = datetime.now()

      try:
        query_result = vector_store.similarity_search(self.query, k=5)
      except Exception as e:
        console.print(f"Error during similarity search: {str(e)}", style="red")
        return []

      et = datetime.now()
      run_time = et - st
      console.print("Context Retrieved", style="orange3")
      console.print(f"Time Taken: {str(run_time)}", style="orange3")

      for result in query_result:
        chunks.append(result.page_content)

      console.print(f"Chunks Retrieved: {str(len(chunks))}", style="orange3")
      return chunks

    except Exception as e:
      console.print(f"Error in retrieveChunks: {str(e)}", style="red")
      return []