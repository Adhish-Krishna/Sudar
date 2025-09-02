from pydantic import BaseModel, Field
from langchain_core.tools import StructuredTool
import os

def saveContent(content: str)->str:

  filename = "content.md"

  current_dir = os.path.dirname(os.path.abspath(__file__))

  output_dir = os.path.join(os.path.dirname(os.path.dirname(current_dir)),'output')

  os.makedirs(output_dir, exist_ok=True)

  filepath = os.path.join(output_dir, filename)

  with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

  return f"Content saved to {filepath}"

class SaveContentInput(BaseModel):
  content: str = Field(..., description="content to be saved in a file")

SaveContentTool = StructuredTool(
  func=saveContent,
  name="SaveContent",
  description="""Use this tool to save generated content in a file in markdown format
  INPUT format: {{"content":"content in string format"}}""",
  args_schema=SaveContentInput
)