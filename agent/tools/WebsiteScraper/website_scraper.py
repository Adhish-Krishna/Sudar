from tavily import TavilyClient
from rich import print as rprint
from pydantic import BaseModel, Field
from crewai.tools import BaseTool
from typing import Type
from envconfig import TAVILY_API_KEY
from typing import Union, List

def scrapWebsite(url: Union[str, List[str]], query: str):
  tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
  rprint("[green]Scrapping the website...[green]")
  context = ""
  urls = [url] if isinstance(url, str) else url
  response = tavily_client.extract(urls=urls, include_images=False)
  for res in response["results"]:
    context += f"URL: {res['url']}\n Raw Content: {res['raw_content']}\n"
  context += f"\n Answer the below query using the above context: \n Query: {query}"
  return context

class WebScraperInput(BaseModel):
    """Input schema for Web Scraper Tool"""
    url: str = Field(
        ..., 
        description="The URL of the website to scrape (must be a single valid URL)"
    )
    query: str = Field(
        ..., 
        description="What specific information to extract from the website"
    )


class WebScraperTool(BaseTool):
    name: str = "Web Scraper"
    description: str = (
        "Extract content from specific websites when URLs are provided. "
        "Use this tool when you have a specific URL and need to extract content from it. "
        "Requires both url (website address) and query (what information to extract)."
    )
    args_schema: Type[BaseModel] = WebScraperInput
    
    def _run(self, url: str, query: str) -> str:
        """Execute website scraping"""
        try:
            result = scrapWebsite(url=url, query=query)
            return result if result else "No content extracted from the website."
        except Exception as e:
            return f"Error scraping website: {str(e)}"