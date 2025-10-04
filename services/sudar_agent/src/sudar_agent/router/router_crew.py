"""Router Crew - Decides which flow to use based on user query."""

from crewai import Agent, Task, Crew, Process, LLM
from typing import Literal

from ..prompts import ROUTER_PROMPT
from ..config.config import config


class RouterCrew:
    """Crew that routes queries to appropriate flows."""
    
    def __init__(self):
        self.llm = self._get_llm()
    
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
    
    def route(self, query: str) -> Literal["WORKSHEET_FLOW", "DOUBT_FLOW"]:
        """
        Analyze query and decide which flow to use.
        
        Args:
            query: User's query
        
        Returns:
            Flow identifier: "WORKSHEET_FLOW" or "DOUBT_FLOW"
        """
        # Create router agent
        router_agent = Agent(
            role='Query Router',
            goal='Analyze user queries and route them to the appropriate flow',
            backstory=ROUTER_PROMPT,
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
        
        # Create routing task
        routing_task = Task(
            description=f"""
            Analyze this user query and determine the best flow to handle it:
            
            Query: {query}
            
            Respond with ONLY one of these exact strings:
            - "WORKSHEET_FLOW" if the user wants to generate worksheets or educational materials
            - "DOUBT_FLOW" if the user wants an explanation, answer, or help with understanding
            
            Output ONLY the flow name, nothing else.
            """,
            expected_output='Either "WORKSHEET_FLOW" or "DOUBT_FLOW"',
            agent=router_agent
        )
        
        # Execute routing
        crew = Crew(
            agents=[router_agent],
            tasks=[routing_task],
            process=Process.sequential,
            verbose=True
        )
        
        result = str(crew.kickoff()).strip().upper()
        
        # Parse result
        if "WORKSHEET" in result:
            return "WORKSHEET_FLOW"
        else:
            return "DOUBT_FLOW"
