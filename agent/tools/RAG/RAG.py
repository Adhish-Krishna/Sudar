from tools.RAG.Chunking import ChunkDocument
from tools.RAG.Retrieve import RetrieveChunks
from rich import print as rprint
from typing import Union
from pydantic import BaseModel, Field
from langchain_core.tools import StructuredTool
import os

def RAG(filepath: str, query: str) -> Union[str, None]:
  '''
  Retrieves context from the vector database based on the given query
  Arguments:
    filepath: str - the filepath of the document to query about
    query : str - the query from the user
  Output:
    context : str | None - the retrieved context from the vector database or else return None
  '''
  filepath = filepath.replace("\\", "/")

  try:
    context = ""
    # Parse and chunk the document
    chunking = ChunkDocument(filepath)

    if not chunking.parseDocument():
      try:
        chunking.initializeEmbeddings()
        chunking.storeEmbeddings()
      except Exception as e:
        rprint(f"[red]Error during embedding initialization: {str(e)}[/red]")
        return None

    # Retrieve context based on the query
    try:
      retrieve = RetrieveChunks(filepath, query)
      chunks: list = retrieve.retrieveChunks()
    except Exception as e:
      rprint(f"[red]Error during chunk retrieval: {str(e)}[/red]")
      return None

    for j, i in enumerate(chunks):
      context += f"Document: {j+1}\n{i}\n"

    return context

  except FileNotFoundError:
    rprint(f"[red]Error: File '{filepath}' not found[/red]")
    return None
  except Exception as e:
    rprint(f"[red]Unexpected error: {str(e)}[/red]")
    return None

def _rag_wrapper(filepath: str, query: str) -> str:
        try:
            filepath = filepath.strip()
            if filepath[0] == "\\":
                filepath = filepath[1:]
            if not os.path.exists(filepath):
                return f"Error: File {filepath} not found"
            context = RAG(filepath, query)
            return context if context else "No relevant content found in document"
        except Exception as e:
            return f"Document processing error: {str(e)}"

class DocumentQueryInput(BaseModel):
    filepath: str = Field(..., description="Full path to the document file")
    query: str = Field(..., description="Specific question or task for the document")

DocumentRetrieverTool = StructuredTool.from_function(
                func=_rag_wrapper,
                name="DocumentRetrieval",
                description="""ONLY use for questions about SPECIFIC DOCUMENTS.
                Requires both filepath and query. File must exist locally.
                Input format: {{"filepath": "path/to/file", "query": "your question"}}""",
                args_schema=DocumentQueryInput
            )
