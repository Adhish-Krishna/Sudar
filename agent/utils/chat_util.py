from rich import print as rprint
from rich.prompt import Prompt, IntPrompt
from langchain_core.messages import AIMessageChunk, HumanMessage, AIMessage
from typing import Dict, Optional, Tuple, Any
import re
from langchain_community.chat_message_histories import SQLChatMessageHistory
import os

def _detect_document_query(input_text: str) -> Optional[Tuple[str, str]]:
        quoted_path_match = re.search(r'"([^"]+\.(pdf|docx|pptx|txt|md))"', input_text)
        if quoted_path_match:
            filepath = quoted_path_match.group(1)
            query = input_text.replace(quoted_path_match.group(0), "").strip()
            return (filepath, query)

        path_match = re.search(r'(\S+\.(pdf|docx|pptx|txt|md))\s+(.+)', input_text)
        if path_match:
            return (path_match.group(1), path_match.group(3))

        return None

def _process_input(user_input: str) -> Dict:
  doc_info = _detect_document_query(user_input)
  if doc_info:
    filepath, query = doc_info
    return {
      "input": f"Document query: {query}",
      "tool_input": {"filepath": filepath, "query": query}
    }
  return {"input": user_input}

def _process_stream_chunk(chunk: Any) -> str:
  """Extract content from different chunk types"""
  if isinstance(chunk, AIMessageChunk):
    return chunk.content
  if isinstance(chunk, dict):
    return chunk.get("output", "")
  return ""

def _save_chat_session(chat_history: SQLChatMessageHistory):
  """Save current chat session to separate database"""
  name = Prompt.ask("[bold green]Enter the name of the chat to save[/bold green]").strip()
  filename = f"chats/chat_{name}.db"

  # Create new database
  saved_chat = SQLChatMessageHistory(
    session_id="saved_session",
    connection=f"sqlite:///{filename}"
  )

  # Copy messages
  for message in chat_history.messages:
    if isinstance(message, HumanMessage):
      saved_chat.add_user_message(message.content)
    elif isinstance(message, AIMessage):
      saved_chat.add_ai_message(message.content)

  rprint(f"[green]Chat saved to {filename}[/green]")

def _load_chat_session(chat_history : SQLChatMessageHistory):
  """Load chat session from saved database"""
  chat_files = [f for f in os.listdir("chats") if f.endswith(".db")]
  if not chat_files:
    rprint("[red]No saved chats found[/red]")
    return

  rprint("[bold]Available chats:[/bold]")
  for idx, file in enumerate(chat_files, 1):
    rprint(f"{idx}. {file}")

  try:
    selection = IntPrompt.ask("Enter chat number to load", default=1, show_default=False)
    selected_file = chat_files[selection - 1]
  except (ValueError, IndexError):
    rprint("[red]Invalid selection[/red]")
    return

  # Load selected chat
  filepath = os.path.join("chats", selected_file)
  loaded_chat = SQLChatMessageHistory(
    session_id="saved_session",
    connection=f"sqlite:///{filepath}"
  )

  # Clear current history and load messages
  chat_history.clear()
  for message in loaded_chat.messages:
    if isinstance(message, HumanMessage):
      chat_history.add_user_message(message.content)
    elif isinstance(message, AIMessage):
      chat_history.add_ai_message(message.content)

  rprint(f"[green]Loaded chat from {selected_file}[/green]")