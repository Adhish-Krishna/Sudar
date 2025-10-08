"""Doubt Clearance Flow - Single-agent flow for answering questions directly."""

from crewai import Agent, Task, Crew, Process, LLM
from crewai.flow.flow import Flow, start
from typing import Dict, Any

from ..tools import ContentRetrieverTool
from ..prompts import DOUBT_SOLVER_PROMPT
from ..config.config import config


class DoubtClearanceFlow(Flow):
    """Flow for answering doubts and questions directly."""
    
    def __init__(self, user_id: str, chat_id: str):
        super().__init__()
        self.user_id = user_id
        self.chat_id = chat_id
        self.llm = self._get_llm()
        
        # Initialize content retriever tool
        self.content_retriever = ContentRetrieverTool(user_id=user_id, chat_id=chat_id)
    
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
    def answer_doubt(self):
        """Answer the user's question directly."""
        query = self.state.get("query", "")
        context = self.state.get("context", "")
        
        # Create Doubt Solver agent
        doubt_solver = Agent(
            role='Educational Doubt Solver',
            goal='Answer student questions clearly and accurately with helpful explanations',
            backstory=DOUBT_SOLVER_PROMPT,
            tools=[self.content_retriever],
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
        
        # Create doubt solving task
        doubt_task = Task(
            description=f"""
            User Question: {query}
            
            {context}
            
            Answer the user's question clearly and accurately.
            If the query contains @filename.ext, use ContentRetrieverTool to get relevant context from documents.
            Provide a comprehensive answer with explanations and examples where appropriate.
            """,
            expected_output="Clear, comprehensive answer to the user's question with explanations and examples",
            agent=doubt_solver
        )
        
        # Execute doubt clearance
        crew = Crew(
            agents=[doubt_solver],
            tasks=[doubt_task],
            process=Process.sequential,
            verbose=True
        )
        
        result = crew.kickoff()
        self.state["answer"] = str(result)
        
        return str(result)
