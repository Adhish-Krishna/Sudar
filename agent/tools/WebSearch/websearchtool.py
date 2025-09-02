from tavily import TavilyClient
from dotenv import load_dotenv
import os
from rich import print as rprint
from pydantic import BaseModel, Field
from langchain_core.tools import StructuredTool

load_dotenv()

tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def web_search(query: str) -> str:
  rprint("[green]Searching the Web...[green]")
  context = tavily_client.get_search_context(query=query,max_tokens=1000,max_results=3)
  return context

class WebSearchInput(BaseModel):
    query: str = Field(..., description="The query to search on the web.")

WebSearchTool = StructuredTool.from_function(
                func=web_search,
                name="WebSearch",
                description="""Use for queries that require up-to-date or external data from the internet.
                Input format: {{"query": "your question"}}""",
                args_schema=WebSearchInput
            )

