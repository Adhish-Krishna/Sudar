from .Chunking import ChunkDocument
from .Retrieve import RetrieveChunks
from rich import print as rprint
from typing import Union
from pydantic import BaseModel, Field
from langchain_core.tools import StructuredTool

def RAG(object_key: str, query: str) -> Union[str, None]:
  '''
  Retrieves context from the vector database based on the given query
  Arguments:
    object_key: str - the object key of the document in MinIO to query about
    query : str - the query from the user
    user_id: str - the user identifier for filtering (default: "teacher001")
    chat_id: str - the chat identifier for filtering (default: "1")
  Output:
    context : str | None - the retrieved context from the vector database or else return None
  '''

  try:
    context = ""
    # Parse and chunk the document
    chunking = ChunkDocument(object_key)

    # This part seems to be for checking if chunks are already in the DB.
    # With MinIO, we might always want to parse, or have a more robust check.
    # For now, we assume we process the object from MinIO.
    # A check could be added here to see if embeddings for this object_key already exist.
    
    try:
      chunking.parseDocument()
      chunking.initializeEmbeddings()
      chunking.storeEmbeddings()
    except Exception as e:
      rprint(f"[red]Error during document processing and embedding: {str(e)}[/red]")
      return None

    # Retrieve context based on the query
    try:
      retrieve = RetrieveChunks(object_key, query)
      chunks: list = retrieve.retrieveChunks()
    except Exception as e:
      rprint(f"[red]Error during chunk retrieval: {str(e)}[/red]")
      return None

    for j, i in enumerate(chunks):
      context += f"Document: {j+1}\n{i['content']}\n"

    return context

  except Exception as e:
    rprint(f"[red]Unexpected error in RAG: {str(e)}[/red]")
    return None

def _rag_wrapper(object_key: str, query: str) -> str:
        try:
            context = RAG(object_key, query)
            return context if context else "No relevant content found in document"
        except Exception as e:
            return f"Document processing error: {str(e)}"

class DocumentQueryInput(BaseModel):
    object_key: str = Field(..., description="The object key of the document in MinIO")
    query: str = Field(..., description="Specific question or task for the document")

DocumentRetrieverTool = StructuredTool.from_function(
                func=_rag_wrapper,
                name="DocumentRetrieval",
                description="""ONLY use for questions about SPECIFIC DOCUMENTS stored in the object store.
                Requires both object_key and query.
                Input format: {{"object_key": "key-of-object", "query": "your question"}}""",
                args_schema=DocumentQueryInput
            )
