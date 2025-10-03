"""
CrewAI-based SUDAR Agent Implementation - Supervisor Architecture
Features:
- Manager agent that plans and delegates
- Specialized sub-agents (Content Researcher, Worksheet Generator)
- Custom Mem0 memory service for conversation context
- Intelligent task planning and execution by the Orchestrator
"""
from crewai import Task, Crew, Process, LLM
from .subagents import ContentResearcherSubAgent, WorksheetGeneratorSubAgent
from .prompts.prompt import (
    contentResearcherPrompt,
    worksheetGeneratorPrompt
)
from .services import AgentMemoryService
from envconfig import (
    GOOGLE_API_KEY, 
    GOOGLE_MODEL_NAME, 
    OLLAMA_MODEL, 
    MODEL_PROVIDER, 
    GROQ_API_KEY, 
    GROQ_MODEL_NAME
)


class SUDARCrew:
    """
    SUDAR Educational Assistant Crew - Supervisor Architecture
    
    Architecture:
    - Content Researcher Sub-Agent: Research with tools (RAG, Web Search, Scraper)
    - Worksheet Generator Sub-Agent: Creates and saves worksheets
    - Custom Memory Service: Mem0 OSS for conversation memory
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

        # Initialize custom memory service with Qdrant + Ollama
        self.memory_service = AgentMemoryService(
            user_id=user_id,
            embedding_model="embeddinggemma:300m",  # Ollama embedding model
            embedding_dimension=768,                 # Dimension for embeddinggemma:300m
            qdrant_host="localhost",
            qdrant_port=6333
        )
        
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
    
    def create_manager_task(self, query: str) -> Task:
        """
        Create manager task with memory context injected
        """
        # Retrieve relevant context from memory using semantic search
        relevant_memories = self.memory_service.get_relevant_context(
            query, 
            limit=5,
            collection="short_term",
            score_threshold=0.5
        )
        
        # # Also get recent messages for temporal context
        # recent_messages = self.memory_service.get_recent_messages(
        #     limit=5,
        #     collection="short_term"
        # )
        
        # Format context for prompt
        context = self.memory_service.format_context_for_prompt(relevant_memories)
        
        return Task(
            description=f"""User Request: {query}

            {context}

            Responsibilities:
            1. Use the conversation context above to personalize responses
            2. Understand what user wants (worksheet/research/greeting/complex request)
            3. Delegate to specialized agents as needed:
            - Content Researcher: DocumentRetrieval, WebSearch, WebScraper
            - Worksheet Generator: ContentSaver (saves worksheets)
            4. Consolidate outputs into final response

            Guidelines:
            - Greeting/intro → Respond warmly, acknowledge name from context, ask how to help
            - Personal questions → Use context to answer (name, previous topics, etc.)
            - Research request → Delegate to Content Researcher
            - Worksheet request → Delegate to Content Researcher then Worksheet Generator
            - User provides content for worksheet → Delegate to Worksheet Generator
            - Complex request → Plan and delegate step by step

            All content must be educational and age-appropriate.
            """,
            expected_output="Complete response using conversation context when relevant",
        )
    
    def kickoff(self, inputs: dict):
        """
        Execute the crew with supervisor architecture and memory management
        
        Args:
            inputs: Dictionary containing 'query' and optional parameters
            
        Returns:
            Crew execution result with memory saved
        """
        query = inputs.get('query', '')
        
        task = self.create_manager_task(query)
        
        crew = Crew(
            agents=[self.content_researcher, self.worksheet_generator],
            tasks=[task],
            process=Process.hierarchical, 
            manager_llm=self.llm,  
            memory=False,
            verbose=True,
        )
        
        # Execute crew
        return crew.kickoff()
    






