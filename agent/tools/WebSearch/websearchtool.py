from tavily import TavilyClient
from rich import print as rprint
from pydantic import BaseModel, Field
from crewai.tools import BaseTool
from envconfig import TAVILY_API_KEY
from typing import Type

def web_search(query: str) -> str:
  rprint("[green]Searching the Web...[green]")
  # Initialize client inside the function to ensure env vars are loaded
  tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
  context = tavily_client.get_search_context(query=query,max_tokens=1000,max_results=3)
  return context

class WebSearchInput(BaseModel):
    """Input schema for Web Search Tool"""
    query: str = Field(
        ..., 
        description="The search query describing what information you need from the web"
    )


class WebSearchTool(BaseTool):
    name: str = "Web Search"
    description: str = (
        "Search the internet for educational content and up-to-date information. "
        "Use this tool when you need to find current information, educational resources, "
        "or supplementary content from the web that is not available in uploaded documents."
    )
    args_schema: Type[BaseModel] = WebSearchInput
    
    def _run(self, query: str) -> str:
        """Execute web search"""
        try:
            result = web_search(query=query)
            return result if result else "No search results found."
        except Exception as e:
            return f"Error performing web search: {str(e)}"

