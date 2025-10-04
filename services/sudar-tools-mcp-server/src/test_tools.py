"""Test script for the MCP server tools."""

import os
from dotenv import load_dotenv
from tools import WebSearchTool, WebsiteScraperTool

# Load environment variables
load_dotenv()


def test_web_search():
    """Test the web search tool."""
    print("\n" + "="*50)
    print("Testing Web Search Tool")
    print("="*50)
    
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        print("❌ TAVILY_API_KEY not found in environment variables")
        return
    
    tool = WebSearchTool(api_key=api_key)
    
    query = "FastMCP Python library"
    print(f"\nSearching for: {query}")
    
    result = tool.search(query, max_results=3)
    
    if result["success"]:
        print(f"✅ Search successful!")
        print(f"\nAnswer: {result.get('answer', 'N/A')}")
        print(f"\nFound {len(result['results'])} results:")
        for i, r in enumerate(result["results"], 1):
            print(f"\n{i}. {r['title']}")
            print(f"   URL: {r['url']}")
            print(f"   Score: {r['score']}")
            print(f"   Content: {r['content'][:150]}...")
    else:
        print(f"❌ Search failed: {result.get('error', 'Unknown error')}")


def test_website_scraper():
    """Test the website scraper tool."""
    print("\n" + "="*50)
    print("Testing Website Scraper Tool")
    print("="*50)
    
    tool = WebsiteScraperTool()
    
    urls = [
        "https://example.com",
        "https://www.python.org"
    ]
    
    print(f"\nScraping {len(urls)} URLs...")
    results = tool.scrape_urls(urls)
    
    for i, result in enumerate(results, 1):
        print(f"\n--- URL {i} ---")
        print(f"URL: {result['url']}")
        
        if result["success"]:
            print(f"✅ Scraping successful!")
            print(f"Title: {result['title']}")
            print(f"Description: {result.get('description', 'N/A')}")
            print(f"Content length: {result['content_length']} characters")
            print(f"Content preview: {result['content'][:200]}...")
        else:
            print(f"❌ Scraping failed: {result.get('error', 'Unknown error')}")


if __name__ == "__main__":
    print("\n🧪 MCP Server Tools Test Suite")
    print("="*50)
    
    test_web_search()
    test_website_scraper()
    
    print("\n" + "="*50)
    print("✨ Tests completed!")
    print("="*50)
