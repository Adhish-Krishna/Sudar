"""
CrewAI-based SUDAR Agent Implementation - Supervisor Architecture
Features:
- Supervisor (Orchestrator) agent that plans and delegates
- Specialized sub-agents (Content Researcher, Worksheet Generator)
- Memory enabled with Ollama embeddings
- Intelligent task planning and execution by the Orchestrator
"""
import os
from crewai import Agent, Task, Crew, Process, LLM
from crewai.memory import ShortTermMemory, EntityMemory
from .subagents import ContentResearcherSubAgent, WorksheetGeneratorSubAgent
from .prompts.prompt import (
    supervisorPrompt,
    contentResearcherPrompt,
    worksheetGeneratorPrompt
)
from envconfig import (
    GOOGLE_API_KEY, 
    GOOGLE_MODEL_NAME, 
    OLLAMA_MODEL, 
    MODEL_PROVIDER, 
    GROQ_API_KEY, 
    GROQ_MODEL_NAME,
    EMBEDDINGS_OLLAMA_MODEL_NAME
)

# Ensure API keys are set in environment for CrewAI's memory system
# This is critical for long-term memory LLM operations
if GOOGLE_API_KEY:
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
    os.environ["GEMINI_API_KEY"] = GOOGLE_API_KEY  # Some versions use this
if GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = GROQ_API_KEY


class SUDARCrew:
    """
    SUDAR Educational Assistant Crew - Supervisor Architecture
    
    Architecture:
    - Orchestrator Agent (Supervisor): Plans, delegates, consolidates
    - Content Researcher Sub-Agent: Research with tools (RAG, Web Search, Scraper)
    - Worksheet Generator Sub-Agent: Creates and saves worksheets
    """
    
    def __init__(self, user_id: str = None, chat_id: str = None):
        """
        Initialize the SUDAR Crew with Supervisor Architecture
        
        Args:
            user_id: User identifier for context
            chat_id: Chat session identifier
        """
        self.user_id = user_id
        self.chat_id = chat_id
        self.llm = self._get_llm()
        
        self.orchestrator = self._create_orchestrator()
        self.content_researcher = ContentResearcherSubAgent.create(
            llm=self.llm,
            prompt=contentResearcherPrompt
        )
        self.worksheet_generator = WorksheetGeneratorSubAgent.create(
            llm=self.llm,
            prompt=worksheetGeneratorPrompt
        )
        
    def _get_llm(self):
        """Get configured LLM based on MODEL_PROVIDER"""
        if MODEL_PROVIDER == 'groq':
            return LLM(
                model=f"groq/{GROQ_MODEL_NAME}",
                api_key=GROQ_API_KEY,
                temperature=0.7,
                stream=True
            )
        elif MODEL_PROVIDER == 'google':
            return LLM(
                model=f"gemini/{GOOGLE_MODEL_NAME}",
                api_key=GOOGLE_API_KEY,
                temperature=0.7,
                stream=True
            )
        else:
            return LLM(
                model=f"ollama/{OLLAMA_MODEL}",
                temperature=0.7,
                stream=True
            )
    
    def _create_orchestrator(self) -> Agent:
        """
        Create the Orchestrator Agent (Supervisor)
        This agent plans the workflow and delegates to sub-agents
        """
        return Agent(
            role='Orchestrator - Master Coordinator',
            goal='Analyze user requests, devise execution plans, and coordinate specialized agents to deliver educational content',
            backstory=supervisorPrompt,
            tools=[],
            llm=self.llm,
            verbose=False,
            allow_delegation=True, 
            memory=True
        )
    
    def create_orchestrator_task(self, query: str) -> Task:
        """
        Create orchestrator task - supervisor plans and delegates
        """
        return Task(
            description=f"""Analyze this user request and coordinate the appropriate agents to fulfill it:
            
            User Request: {query}
            
            Your responsibilities:
            1. Deeply understand what the user wants (worksheet, research, greeting, complex request, etc.)
            2. Create an optimal execution plan
            3. Delegate tasks to the appropriate specialized agents:
               - Content Researcher Agent: For gathering educational content from documents, web, URLs
               - Worksheet Generator Agent: For creating and saving worksheets
            4. Consolidate outputs from sub-agents into a cohesive final response
            5. Deliver the response in the format the user expects
            
            Available Agents and Their Capabilities:
            - Content Researcher: Has DocumentRetrieval, WebSearch, WebScraper tools
            - Worksheet Generator: Has ContentSaver tool (MUST save worksheets)
            
            Decision Guidelines (YOU decide the workflow):
            - If user greets you → Respond warmly and ask how you can help
            - If user asks for research → Delegate to Content Researcher
            - If user asks for worksheet → Delegate to Content Researcher first (for content), then Worksheet Generator
            - If user provides content and asks for worksheet → Delegate directly to Worksheet Generator
            - If user asks complex multi-step request → Plan and delegate step by step
            
            Ensure all content is educationally sound and age-appropriate.
            Consolidate all agent outputs into a final, cohesive response.
            """,
            expected_output="A complete response to the user's request with all required educational content",
            agent=self.orchestrator
        )
    
    def kickoff(self, inputs: dict):
        """
        Execute the crew with supervisor architecture
        Let the Orchestrator agent decide everything!
        
        Args:
            inputs: Dictionary containing 'query' and optional parameters
            
        Returns:
            Crew execution result
        """
        query = inputs.get('query', '')
        
        task = self.create_orchestrator_task(query)
        
        # Configure Ollama embedder - ChromaDB OllamaEmbeddingFunction uses 'model_name' not 'model'
        embedder_config = {
            "provider": "ollama",
            "config": {
                "model_name": EMBEDDINGS_OLLAMA_MODEL_NAME,  # Changed from 'model' to 'model_name'
                "url": "http://localhost:11434"  # Base URL without /api/embeddings
            }
        }
        
        short_term_memory = ShortTermMemory(embedder_config=embedder_config)
        entity_memory = EntityMemory(embedder_config=embedder_config)
        
        crew = Crew(
            agents=[self.orchestrator, self.content_researcher, self.worksheet_generator],
            tasks=[task],
            process=Process.hierarchical, 
            manager_llm=self.llm,  
            memory=True,  
            short_term_memory=short_term_memory,  
            entity_memory=entity_memory,  
            verbose=False
        )
        
        return crew.kickoff()
