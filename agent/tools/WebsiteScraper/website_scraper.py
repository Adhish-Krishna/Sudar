from tavily import TavilyClient
from rich import print as rprint
from pydantic import BaseModel, Field
from langchain_core.tools import StructuredTool
from envconfig import TAVILY_API_KEY

def scrapWebsite(url: str | list, query: str):
  tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
  rprint("[green]Scrapping the website...[green]")
  context = ""
  urls = [url] if isinstance(url,str) else url
  response = tavily_client.extract(urls=urls, include_images=False)
  for res in response["results"]:
    context += f"URL: {res['url']}\n Raw Content: {res['raw_content']}\n"
  context += f"\n Answer the below query using the above context: \n Query: {query}"
  return context

class ScrapWebsite(BaseModel):
    url : str | list = Field(..., description="a single web url or a python list of web urls" )
    query: str = Field(..., description="Specific question or task about the content of the website")

WebScraperTool = StructuredTool.from_function(
                func=scrapWebsite,
                name="WebsiteScraper",
                description="""ONLY use this tool when the user provides any WEB URLs. This tool scraps the website and gives the context.
                INPUT format: {{"url":"WEB URL", "query":"your question"}}""",
                args_schema=ScrapWebsite
            )