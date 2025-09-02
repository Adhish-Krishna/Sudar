"""
Sudar AI Agent - Intelligent Educational Assistant
Built using DeepAgents framework with Qwen3:4b model via Ollama
"""

import os
from typing import Literal
from dotenv import load_dotenv
from rich import print as rprint

# Import LangChain components
from langchain_ollama import ChatOllama
from deepagents import create_deep_agent

# Import existing tools
from tools.WebSearch.websearchtool import WebSearchTool
from tools.WebsiteScraper.website_scraper import WebScraperTool
from tools.ContentSaver.contentSaverTool import SaveContentTool
from tools.RAG.RAG import DocumentRetrieverTool

# Load environment variables
load_dotenv()

class SudarAIAgent:
    """
    Sudar AI Agent - Main orchestrator for educational content research and worksheet generation
    
    Architecture Components:
    - Orchestrator: Main planning and coordination agent
    - Content Researcher: Specialized agent for research tasks
    - Worksheet Generator: Specialized agent for creating educational materials
    """
    
    def __init__(self):
        """Initialize the Sudar AI Agent with Qwen3:4b model and tools"""
        self.model = self._initialize_model()
        self.tools = self._initialize_tools()
        self.agent = self._create_agent()
        
    def _initialize_model(self) -> ChatOllama:
        """Initialize Qwen3:4b model via Ollama"""
        try:
            model = ChatOllama(
                model="qwen3:4b",  # Using your available qwen3:4b model
                temperature=0.7,
                base_url="http://localhost:11434",
                verbose=False,  # Reduce verbosity
                timeout=60,  # Add timeout
                num_predict=2048,  # Limit response length
            )
            rprint("[green]✓ Qwen model initialized successfully[/green]")
            return model
        except Exception as e:
            rprint(f"[red]✗ Error initializing Qwen model: {e}[/red]")
            rprint("[yellow]Please ensure Ollama is running and Qwen model is installed[/yellow]")
            raise
    
    def _initialize_tools(self) -> list:
        """Initialize all available tools for the agent"""
        tools = [
            WebSearchTool,
            WebScraperTool,
            DocumentRetrieverTool,
            SaveContentTool
        ]
        rprint(f"[green]✓ Initialized {len(tools)} tools[/green]")
        return tools
    
    def _create_agent(self):
        """Create the main Sudar AI agent with sub-agents"""
        
        # Main orchestrator instructions
        orchestrator_instructions = """You are Sudar, an intelligent educational AI assistant. 

Your main job is to help with:
1. Research topics using web search and document analysis
2. Create educational worksheets and materials
3. Answer questions about academic subjects

When a user asks for a worksheet:
1. First plan what content you need
2. If you need to research the topic, use the content-researcher sub-agent
3. Then use the worksheet-generator sub-agent to create the worksheet
4. Save the final worksheet using the SaveContent tool

For the Java OOP worksheet request, you can directly create it since you have knowledge of Java OOP concepts.

Keep responses clear and educational."""

        # Content Researcher sub-agent
        content_researcher = {
            "name": "content-researcher",
            "description": "Research topics using web search, website scraping, and document analysis",
            "prompt": """You are a research specialist. Use the available tools to find information about topics:
- WebSearch for general research
- WebsiteScraper for specific URLs  
- DocumentRetrieval for analyzing documents
Provide clear, organized research findings.""",
            "tools": ["WebSearch", "WebsiteScraper", "DocumentRetrieval"]
        }
        
        # Worksheet Generator sub-agent  
        worksheet_generator = {
            "name": "worksheet-generator", 
            "description": "Create educational worksheets and learning materials",
            "prompt": """You are a worksheet creator. Create educational materials including:
- Questions and exercises appropriate for the grade level
- Clear instructions and examples
- Answer keys when requested
Save the final worksheet using SaveContent tool.""",
            "tools": ["SaveContent"]
        }
        
        # Create the deep agent with sub-agents
        subagents = [content_researcher, worksheet_generator]
        
        try:
            agent = create_deep_agent(
                tools=self.tools,
                instructions=orchestrator_instructions,
                model=self.model,
                subagents=subagents
            )
            rprint("[green]✓ Sudar AI Agent created successfully[/green]")
            return agent
        except Exception as e:
            rprint(f"[red]✗ Error creating agent: {e}[/red]")
            raise
    
    def simple_test(self, message: str = "Hello, I'm testing the agent"):
        """Simple test method to check if agent is working"""
        try:
            rprint("[cyan]Running simple test...[/cyan]")
            result = self.model.invoke(message)
            rprint(f"[green]Model test successful: {result.content[:100]}...[/green]")
            return True
        except Exception as e:
            rprint(f"[red]Model test failed: {e}[/red]")
            return False
    
    def chat(self, message: str, thread_id: str = "default", debug: bool = False):
        """
        Chat with the Sudar AI Agent
        
        Args:
            message (str): User's message/query
            thread_id (str): Conversation thread identifier
            debug (bool): Enable debug output
            
        Returns:
            Response from the agent
        """
        config = {"configurable": {"thread_id": thread_id}}
        
        try:
            rprint(f"[blue]User:[/blue] {message}")
            rprint("[cyan]Sudar is thinking...[/cyan]")
            
            if debug:
                rprint("[dim]Debug: Starting agent invocation...[/dim]")
            
            # Use invoke instead of stream for more reliable response
            result = self.agent.invoke(
                {"messages": [{"role": "user", "content": message}]}, 
                config=config
            )
            
            if debug:
                rprint(f"[dim]Debug: Agent result keys: {result.keys()}[/dim]")
            
            # Extract the final response
            if "messages" in result and result["messages"]:
                final_message = result["messages"][-1]
                if hasattr(final_message, 'content'):
                    response_content = final_message.content
                    rprint(f"[green]Sudar:[/green] {response_content}")
                    return response_content
                else:
                    rprint(f"[green]Sudar:[/green] {str(final_message)}")
                    return str(final_message)
            else:
                rprint("[yellow]Sudar: I processed your request but didn't generate a text response.[/yellow]")
                return "Task completed"
                        
        except Exception as e:
            rprint(f"[red]Error during chat: {e}[/red]")
            if debug:
                import traceback
                rprint(f"[red]Full traceback:\n{traceback.format_exc()}[/red]")
            return f"I apologize, but I encountered an error: {e}"
    
    def invoke(self, message: str, thread_id: str = "default"):
        """
        Invoke the agent with a message and return the complete response
        
        Args:
            message (str): User's message/query
            thread_id (str): Conversation thread identifier
            
        Returns:
            Complete response from the agent
        """
        config = {"configurable": {"thread_id": thread_id}}
        
        try:
            result = self.agent.invoke(
                {"messages": [{"role": "user", "content": message}]}, 
                config=config
            )
            return result
        except Exception as e:
            rprint(f"[red]Error during invocation: {e}[/red]")
            return {"error": str(e)}

def main():
    """Main function to demonstrate the Sudar AI Agent"""
    rprint("[bold blue]🎓 Initializing Sudar AI Agent...[/bold blue]")
    
    try:
        # Initialize the agent
        sudar = SudarAIAgent()
        
        # Test the model first
        if not sudar.simple_test():
            rprint("[red]Model test failed. Exiting...[/red]")
            return
        
        rprint("[bold green]🚀 Sudar AI Agent is ready![/bold green]")
        rprint("[yellow]Type 'quit' or 'exit' to end the conversation[/yellow]")
        rprint("[yellow]Type 'debug' to enable debug mode[/yellow]")
        rprint("[dim]Example queries:[/dim]")
        rprint("[dim]- Research machine learning fundamentals[/dim]")
        rprint("[dim]- Create a worksheet about photosynthesis for grade 8[/dim]")
        rprint("[dim]- Analyze this document: [file_path][/dim]")
        print()
        
        debug_mode = False
        
        # Interactive chat loop
        while True:
            try:
                user_input = input("You: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'bye']:
                    rprint("[blue]👋 Goodbye! Happy learning![/blue]")
                    break
                    
                if user_input.lower() == 'debug':
                    debug_mode = not debug_mode
                    rprint(f"[yellow]Debug mode: {'ON' if debug_mode else 'OFF'}[/yellow]")
                    continue
                    
                if not user_input:
                    continue
                    
                # Chat with Sudar
                sudar.chat(user_input, debug=debug_mode)
                print()
                
            except KeyboardInterrupt:
                rprint("\n[blue]👋 Goodbye! Happy learning![/blue]")
                break
            except Exception as e:
                rprint(f"[red]Unexpected error: {e}[/red]")
                
    except Exception as e:
        rprint(f"[red]Failed to initialize Sudar AI Agent: {e}[/red]")
        rprint("[yellow]Please check your environment setup and try again[/yellow]")

if __name__ == "__main__":
    main()
