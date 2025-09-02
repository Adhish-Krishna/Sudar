"""
Setup and test script for Sudar AI Agent
"""

import subprocess
import sys
import os
from rich import print as rprint

def check_ollama():
    """Check if Ollama is running and has the required model"""
    try:
        import requests
        response = requests.get("http://localhost:11434/api/tags")
        if response.status_code == 200:
            models = response.json()
            available_models = [model['name'] for model in models.get('models', [])]
            rprint(f"[green]✓ Ollama is running[/green]")
            rprint(f"Available models: {available_models}")
            
            # Check for Qwen models
            qwen_models = [m for m in available_models if 'qwen' in m.lower()]
            if qwen_models:
                rprint(f"[green]✓ Qwen models found: {qwen_models}[/green]")
            else:
                rprint("[yellow]⚠ No Qwen models found. Install with: ollama pull qwen2.5:3b[/yellow]")
                
            return True
    except Exception as e:
        rprint(f"[red]✗ Ollama not running or not accessible: {e}[/red]")
        rprint("[yellow]Please start Ollama with: ollama serve[/yellow]")
        return False

def check_env_file():
    """Check if .env file exists and has required variables"""
    env_path = ".env"
    if not os.path.exists(env_path):
        rprint("[yellow]⚠ .env file not found. Creating from template...[/yellow]")
        if os.path.exists(".env.template"):
            with open(".env.template", 'r') as template:
                with open(".env", 'w') as env_file:
                    env_file.write(template.read())
            rprint("[green]✓ .env file created from template[/green]")
            rprint("[yellow]Please edit .env file with your API keys[/yellow]")
        else:
            rprint("[red]✗ .env.template not found[/red]")
        return False
    else:
        rprint("[green]✓ .env file exists[/green]")
        return True

def test_agent():
    """Test the Sudar AI Agent initialization"""
    try:
        from agent import SudarAIAgent
        rprint("[cyan]Testing Sudar AI Agent initialization...[/cyan]")
        agent = SudarAIAgent()
        rprint("[green]✓ Sudar AI Agent initialized successfully![/green]")
        return True
    except Exception as e:
        rprint(f"[red]✗ Failed to initialize agent: {e}[/red]")
        return False

def main():
    """Main setup and test function"""
    rprint("[bold blue]🎓 Sudar AI Agent Setup & Test[/bold blue]")
    rprint("=" * 50)
    
    # Check environment file
    env_ok = check_env_file()
    
    # Check Ollama
    ollama_ok = check_ollama()
    
    if env_ok and ollama_ok:
        # Test agent initialization
        agent_ok = test_agent()
        
        if agent_ok:
            rprint("\n[bold green]🚀 All checks passed! Sudar AI Agent is ready to use.[/bold green]")
            rprint("[dim]Run 'python agent.py' to start the interactive chat[/dim]")
        else:
            rprint("\n[bold red]❌ Agent initialization failed[/bold red]")
    else:
        rprint("\n[bold yellow]⚠ Setup incomplete. Please resolve the issues above.[/bold yellow]")

if __name__ == "__main__":
    main()
