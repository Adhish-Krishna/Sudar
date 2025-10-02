from .Chunking import ChunkDocument
from .Retrieve import RetrieveChunks
from rich import print as rprint
from typing import Union
from pydantic import BaseModel, Field
from crewai.tools import BaseTool
from typing import Type

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

class DocumentRetrievalInput(BaseModel):
    """Input schema for Document Retrieval Tool"""
    object_key: str = Field(
        ..., 
        description="The unique identifier/path of the document in MinIO storage (e.g., 'user123/chat456/document.pdf')"
    )
    query: str = Field(
        ..., 
        description="The specific question or information you want to extract from the document"
    )

class DocumentRetrievalTool(BaseTool):
    name: str = "Document Retrieval"
    description: str = (
        "Retrieve and query information from documents stored in MinIO. "
        "Use this tool ONLY when you need to extract information from specific documents "
        "that have been uploaded to the system. "
        "Requires both object_key (document identifier) and query (what to extract)."
    )
    args_schema: Type[BaseModel] = DocumentRetrievalInput
    
    def _run(self, object_key: str, query: str) -> str:
        """Execute document retrieval"""
        try:
            result = RAG(object_key=object_key, query=query)
            return result if result else "No relevant content found in the document."
        except Exception as e:
            return f"Error retrieving document: {str(e)}"