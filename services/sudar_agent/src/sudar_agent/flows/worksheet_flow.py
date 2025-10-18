"""Worksheet Generator Flow - Two-agent flow for content research and worksheet generation."""

from crewai import Agent, Task, Crew, Process, LLM
from crewai.flow.flow import Flow, listen, start
from typing import Dict, Any

from ..tools import WebSearchTool, WebsiteScraperTool, ContentSaverTool, ContentRetrieverTool
from ..prompts import CONTENT_RESEARCHER_PROMPT, WORKSHEET_GENERATOR_PROMPT
from ..config.config import config


class WorksheetGeneratorFlow(Flow):
    """Flow for generating worksheets with content research."""
    
    def __init__(self, user_id: str, chat_id: str, classroom_id: str):
        super().__init__()
        self.user_id = user_id
        self.chat_id = chat_id
        self.classroom_id = classroom_id
        self.llm = self._get_llm()
        
        # Initialize tools with user/chat context
        self.content_retriever = ContentRetrieverTool(user_id=user_id, chat_id=chat_id, classroom_id=classroom_id)
        self.content_saver = ContentSaverTool(user_id=user_id, chat_id=chat_id, classroom_id=classroom_id)
        self.web_search = WebSearchTool()
        self.web_scraper = WebsiteScraperTool()
    
    def _get_llm(self) -> LLM:
        """Get configured LLM."""
        llm_config = config.get_llm_config()
        if llm_config["provider"] == "ollama":
            return LLM(
                model=llm_config["model"],
                temperature=llm_config.get("temperature", 0.7)
            )
        else:
            return LLM(
                model=llm_config["model"],
                api_key=llm_config.get("api_key"),
                temperature=llm_config.get("temperature", 0.7)
            )
    
    @start()
    def research_content(self):
        """First step: Research content using Content Researcher agent."""
        query = self.state.get("query", "")
        context = self.state.get("context", "")
        
        # Create Content Researcher agent
        content_researcher = Agent(
            role='Educational Content Researcher',
            goal='Research and gather high-quality educational content from various sources',
            backstory=CONTENT_RESEARCHER_PROMPT,
            tools=[self.content_retriever, self.web_search, self.web_scraper],
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
        
        # Create research task
        research_task = Task(
            description=f"""
            User Query: {query}
            
            {context}
            
            Research relevant educational content for creating a worksheet. 
            If the query contains @filename.ext, use ContentRetrieverTool to get document context.
            Supplement with web search for additional information.
            Provide comprehensive research findings with sources and key learning points.
            """,
            expected_output="Comprehensive research findings with educational content, sources, and key concepts",
            agent=content_researcher
        )
        
        # Execute research
        crew = Crew(
            agents=[content_researcher],
            tasks=[research_task],
            process=Process.sequential,
            verbose=True
        )
        
        result = crew.kickoff()
        self.state["research_findings"] = str(result)
        
        return str(result)
    
    @listen(research_content)
    def generate_worksheet(self):
        """Second step: Generate worksheet using Worksheet Generator agent."""
        query = self.state.get("query", "")
        research_findings = self.state.get("research_findings", "")
        
        # Create Worksheet Generator agent
        worksheet_generator = Agent(
            role='Educational Worksheet Generator',
            goal='Create personalized, engaging educational worksheets and save them to storage',
            backstory=WORKSHEET_GENERATOR_PROMPT,
            tools=[self.content_saver],
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
        
        # Create worksheet generation task
        worksheet_task = Task(
            description=f"""
            User Query: {query}
            
            Research Findings:
            {research_findings}
            
            Based on the research findings above, create a comprehensive educational worksheet.
            Use proper Markdown formatting with title, learning objectives, questions, and answer key.
            After creating the worksheet content, MUST use ContentSaverTool to save it as a PDF.
            """,
            expected_output="Generated worksheet in Markdown format, saved to storage with confirmation",
            agent=worksheet_generator
        )
        
        # Execute worksheet generation
        crew = Crew(
            agents=[worksheet_generator],
            tasks=[worksheet_task],
            process=Process.sequential,
            verbose=True
        )
        
        result = crew.kickoff()
        self.state["worksheet_result"] = str(result)
        
        return str(result)
