from tavily import TavilyClient
from rich import print as rprint
from pydantic import BaseModel, Field
from langchain_core.tools import StructuredTool
from envconfig import TAVILY_API_KEY


def web_search(query: str) -> str:
  rprint("[green]Searching the Web...[green]")
  # Initialize client inside the function to ensure env vars are loaded
  tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
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

