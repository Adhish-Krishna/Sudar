"""Main Orchestrator for Sudar Agent - Coordinates routing and flow execution."""

import logging
from typing import Dict, Any, AsyncGenerator

from .router import RouterCrew
from .flows import WorksheetGeneratorFlow, DoubtClearanceFlow
from .services import AgentMemoryService, ChatService

logger = logging.getLogger(__name__)


class SudarAgentOrchestrator:
    """Main orchestrator that coordinates the agent system."""
    
    def __init__(self, user_id: str, chat_id: str, subject_id: str = None):
        """
        Initialize the orchestrator.
        
        Args:
            user_id: User identifier
            chat_id: Chat session identifier
            subject_id: Optional classroom identifier
        """
        self.user_id = user_id
        self.chat_id = chat_id
        self.subject_id = subject_id
        
        # Initialize services
        self.memory_service = AgentMemoryService(
            user_id=user_id, 
            chat_id=chat_id,
            subject_id=subject_id
        )
        self.chat_service = ChatService()
        
        # Initialize router
        self.router = RouterCrew()
        
        logger.info(f"SudarAgentOrchestrator initialized for user: {user_id}, chat: {chat_id}, classroom: {subject_id}")
    
    def process_query(self, query: str) -> str:
        """
        Process a user query through the appropriate flow.
        
        Args:
            query: User's query
        
        Returns:
            Agent's response
        """
        try:
            # Save user message to MongoDB
            self.chat_service.save_message(
                user_id=self.user_id,
                chat_id=self.chat_id,
                role="user",
                content=query,
                subject_id=self.subject_id
            )
            
            # Save user message to memory
            self.memory_service.add_message(
                role="user",
                content=query,
                collection="short_term"
            )
            
            # Get relevant context from memory
            relevant_memories = self.memory_service.get_relevant_context(
                query=query,
                limit=5,
                collection="short_term",
                score_threshold=0.5
            )
            context = self.memory_service.format_context_for_prompt(relevant_memories)
            
            # Route the query
            logger.info(f"Routing query: {query[:100]}...")
            flow_type = self.router.route(query)
            logger.info(f"Routed to: {flow_type}")
            
            # Save router decision to MongoDB
            self.chat_service.save_message(
                user_id=self.user_id,
                chat_id=self.chat_id,
                role="router",
                content=f"Routed to: {flow_type}",
                subject_id=self.subject_id,
                metadata={"flow_type": flow_type}
            )
            
            # Execute the appropriate flow
            if flow_type == "WORKSHEET_FLOW":
                flow = WorksheetGeneratorFlow(user_id=self.user_id, chat_id=self.chat_id, subject_id=self.subject_id)
                
                # Kick off the flow with initial state
                flow.kickoff(inputs={
                    "query": query,
                    "context": context
                })
                
                # Get the final result
                result = flow.state.get("worksheet_result", "Worksheet generation completed.")
                
                # Save intermediate results to MongoDB
                research_findings = flow.state.get("research_findings", "")
                if research_findings:
                    self.chat_service.save_message(
                        user_id=self.user_id,
                        chat_id=self.chat_id,
                        role="content_researcher",
                        content=research_findings,
                        subject_id=self.subject_id
                    )
                
                # Save final result
                self.chat_service.save_message(
                    user_id=self.user_id,
                    chat_id=self.chat_id,
                    role="worksheet_generator",
                    content=result,
                    subject_id=self.subject_id
                )
                
            else:  # DOUBT_FLOW
                flow = DoubtClearanceFlow(user_id=self.user_id, chat_id=self.chat_id, subject_id=self.subject_id)
                
                # Kick off the flow with initial state
                flow.kickoff(inputs={
                    "query": query,
                    "context": context
                })
                
                # Get the answer
                result = flow.state.get("answer", "Answer generated.")
                
                # Save to MongoDB
                self.chat_service.save_message(
                    user_id=self.user_id,
                    chat_id=self.chat_id,
                    role="doubt_solver",
                    content=result,
                    subject_id=self.subject_id
                )
            
            # Save agent response to memory
            self.memory_service.add_message(
                role="agent",
                content=result,
                collection="short_term"
            )
            
            # Save final agent response to MongoDB
            self.chat_service.save_message(
                user_id=self.user_id,
                chat_id=self.chat_id,
                role="agent",
                content=result,
                subject_id=self.subject_id
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}", exc_info=True)
            error_message = f"I encountered an error while processing your request: {str(e)}"
            
            # Save error to MongoDB
            self.chat_service.save_message(
                user_id=self.user_id,
                chat_id=self.chat_id,
                role="agent",
                content=error_message,
                subject_id=self.subject_id,
                metadata={"error": True}
            )
            
            return error_message
