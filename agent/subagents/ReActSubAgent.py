from langchain.chat_models.base import BaseChatModel
from langchain.tools.base import BaseTool
from langgraph.prebuilt import create_react_agent

class ReActSubAgent:
    def __call__(self, model: BaseChatModel, name: str, tools: list[BaseTool], prompt: str):
        return create_react_agent(
            model=model,
            name=name,
            tools=tools,
            prompt=prompt
        )