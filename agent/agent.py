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
                model=os.getenv("OLLAMA_MODEL"),  # Using your available qwen3:4b model
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
        Chat with the Sudar AI Agent with streaming intermediate responses
        
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
            print()
            
            if debug:
                rprint("[dim]Debug: Starting agent streaming...[/dim]")
            
            # Stream the response to show intermediate steps
            final_response = ""
            
            for chunk in self.agent.stream(
                {"messages": [{"role": "user", "content": message}]}, 
                config=config,
                stream_mode="values"  # Stream all intermediate values
            ):
                if debug:
                    rprint(f"[dim]Debug: Chunk keys: {list(chunk.keys())}[/dim]")
                
                # Handle messages (main responses and sub-agent calls)
                if "messages" in chunk and chunk["messages"]:
                    last_message = chunk["messages"][-1]
                    
                    # Check if it's a tool call (sub-agent invocation)
                    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
                        for tool_call in last_message.tool_calls:
                            tool_name = tool_call.get('name', 'Unknown Tool')
                            rprint(f"[yellow]🔧 Calling: {tool_name}[/yellow]")
                            if debug:
                                rprint(f"[dim]   Args: {tool_call.get('args', {})}[/dim]")
                    
                    # Check if it's a regular message with content
                    elif hasattr(last_message, 'content') and last_message.content:
                        content = last_message.content.strip()
                        if content:
                            # Check if it's from a sub-agent or main agent
                            message_type = getattr(last_message, 'name', None)
                            if message_type:
                                rprint(f"[magenta]🤖 {message_type}:[/magenta] {content}")
                            else:
                                rprint(f"[green]🧠 Sudar:[/green] {content}")
                            final_response = content
                    
                    # Handle tool responses
                    elif hasattr(last_message, 'name') and last_message.name:
                        tool_name = last_message.name
                        content = getattr(last_message, 'content', '')
                        if content:
                            # Truncate long tool responses for readability
                            if len(content) > 200:
                                display_content = content[:200] + "..."
                            else:
                                display_content = content
                            rprint(f"[cyan]📊 {tool_name} result:[/cyan] {display_content}")
                
                # Handle planning steps (todos)
                if "todos" in chunk and chunk["todos"]:
                    rprint("[blue]📋 Planning:[/blue]")
                    for i, todo in enumerate(chunk["todos"], 1):
                        rprint(f"   {i}. {todo}")
                    print()
                
                # Handle file operations
                if "files" in chunk and chunk["files"]:
                    files = chunk["files"]
                    for filename, _ in files.items():
                        rprint(f"[green]💾 Saved file: {filename}[/green]")
            
            print()
            if final_response:
                return final_response
            else:
                rprint("[yellow]✅ Task completed successfully[/yellow]")
                return "Task completed"
                        
        except Exception as e:
            rprint(f"[red]❌ Error during chat: {e}[/red]")
            if debug:
                import traceback
                rprint(f"[red]Full traceback:\n{traceback.format_exc()}[/red]")
            return f"I apologize, but I encountered an error: {e}"
    
    def chat_verbose(self, message: str, thread_id: str = "default"):
        """
        Verbose chat with detailed streaming of all agent steps
        """
        config = {"configurable": {"thread_id": thread_id}}
        
        try:
            rprint(f"[blue]User:[/blue] {message}")
            rprint("[cyan]🚀 Starting Sudar AI processing...[/cyan]")
            print("=" * 60)
            
            step_count = 0
            final_response = ""
            
            # Stream with different modes to catch all events
            for chunk in self.agent.stream(
                {"messages": [{"role": "user", "content": message}]}, 
                config=config,
                stream_mode="updates"  # Shows updates as they happen
            ):
                step_count += 1
                
                for node_name, node_output in chunk.items():
                    rprint(f"[bold yellow]Step {step_count}: {node_name}[/bold yellow]")
                    
                    # Handle different types of outputs
                    if "messages" in node_output:
                        messages = node_output["messages"]
                        if messages:
                            last_msg = messages[-1]
                            
                            # Tool calls (sub-agent invocations)
                            if hasattr(last_msg, 'tool_calls') and last_msg.tool_calls:
                                for tool_call in last_msg.tool_calls:
                                    tool_name = tool_call.get('name', 'Unknown')
                                    args = tool_call.get('args', {})
                                    rprint(f"  [magenta]🔧 Invoking: {tool_name}[/magenta]")
                                    if args:
                                        rprint(f"  [dim]   Arguments: {str(args)[:100]}...[/dim]")
                            
                            # Regular content
                            elif hasattr(last_msg, 'content') and last_msg.content:
                                content = last_msg.content.strip()
                                if content:
                                    # Check if it's a sub-agent response
                                    if hasattr(last_msg, 'name') and last_msg.name:
                                        rprint(f"  [cyan]🤖 {last_msg.name}:[/cyan] {content[:200]}...")
                                    else:
                                        rprint(f"  [green]💭 Response:[/green] {content}")
                                        final_response = content
                            
                            # Tool responses
                            elif hasattr(last_msg, 'name') and hasattr(last_msg, 'content'):
                                tool_name = last_msg.name
                                result = last_msg.content
                                rprint(f"  [blue]📊 {tool_name} completed[/blue]")
                                if len(result) > 100:
                                    rprint(f"  [dim]   Result: {result[:100]}...[/dim]")
                    
                    # Planning updates
                    if "todos" in node_output and node_output["todos"]:
                        rprint(f"  [yellow]📋 Updated Plan:[/yellow]")
                        for i, todo in enumerate(node_output["todos"], 1):
                            rprint(f"    {i}. {todo}")
                    
                    # File operations
                    if "files" in node_output and node_output["files"]:
                        for filename in node_output["files"].keys():
                            rprint(f"  [green]💾 File saved: {filename}[/green]")
                    
                    print("-" * 40)
            
            print("=" * 60)
            rprint("[bold green]🎉 Processing complete![/bold green]")
            return final_response
                        
        except Exception as e:
            rprint(f"[red]❌ Error in verbose chat: {e}[/red]")
            import traceback
            rprint(f"[red]Traceback:\n{traceback.format_exc()}[/red]")
            return f"Error: {e}"
    
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
        rprint("[yellow]Commands:[/yellow]")
        rprint("[yellow]  'quit' or 'exit' - End conversation[/yellow]")
        rprint("[yellow]  'debug' - Toggle debug mode[/yellow]")
        rprint("[yellow]  'verbose' - Toggle verbose streaming mode[/yellow]")
        rprint("[dim]Example queries:[/dim]")
        rprint("[dim]- Research machine learning fundamentals[/dim]")
        rprint("[dim]- Create a worksheet about photosynthesis for grade 8[/dim]")
        rprint("[dim]- Analyze this document: [file_path][/dim]")
        print()
        
        debug_mode = False
        verbose_mode = False
        
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
                    
                if user_input.lower() == 'verbose':
                    verbose_mode = not verbose_mode
                    rprint(f"[yellow]Verbose streaming: {'ON' if verbose_mode else 'OFF'}[/yellow]")
                    continue
                    
                if not user_input:
                    continue
                    
                # Chat with Sudar using appropriate mode
                if verbose_mode:
                    sudar.chat_verbose(user_input)
                else:
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
