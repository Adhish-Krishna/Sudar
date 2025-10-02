"""
Generalized Sub-Agent Implementation for CrewAI
Each sub-agent is a specialized worker with specific tools and expertise
"""
from crewai import Agent
from typing import List
from ..tools import (
    DocumentRetrievalTool,
    WebSearchTool,
    WebScraperTool,
    ContentSaverTool
)


class ContentResearcherSubAgent:
    """
    Content Researcher Sub-Agent
    Specialized in educational content gathering and research
    """
    
    @staticmethod
    def create(llm, prompt: str) -> Agent:
        """
        Create Content Researcher agent instance
        
        Args:
            llm: Language model to use
            prompt: System prompt/backstory for the agent
            
        Returns:
            Configured Agent instance
        """
        # Initialize tools
        doc_tool = DocumentRetrievalTool()
        web_tool = WebSearchTool()
        scraper_tool = WebScraperTool()
        
        return Agent(
            role='Educational Content Researcher',
            goal='Research and gather high-quality educational content from various sources',
            backstory=prompt,
            tools=[doc_tool, web_tool, scraper_tool],
            llm=llm,
            verbose=False,
            allow_delegation=False,
            max_iter=5,
            memory=True
        )


class WorksheetGeneratorSubAgent:
    """
    Worksheet Generator Sub-Agent
    Specialized in creating personalized educational worksheets
    """
    
    @staticmethod
    def create(llm, prompt: str) -> Agent:
        """
        Create Worksheet Generator agent instance
        
        Args:
            llm: Language model to use
            prompt: System prompt/backstory for the agent
            
        Returns:
            Configured Agent instance
        """
        # Initialize tools
        saver_tool = ContentSaverTool()
        
        return Agent(
            role='Educational Worksheet Generator',
            goal='Create personalized, engaging educational worksheets and save them to storage',
            backstory=prompt,
            tools=[saver_tool],
            llm=llm,
            verbose=False,
            allow_delegation=False,
            max_iter=5,
            memory=True
        )
