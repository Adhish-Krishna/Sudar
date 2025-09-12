from pydantic import BaseModel, Field
from langchain_core.tools import StructuredTool
from minio import Minio
from envconfig import MINIO_ACCESS_KEY, MINIO_BUCKET_NAME, MINIO_SECRET_KEY, MINIO_URL
from spire.doc import Document, FileFormat
from ...utils import getUserIdChatId
import io
from minio.commonconfig import Tags
import os
from rich import print as rprint

def saveContent(content: str, title: str)->str:
  user_id, chat_id = getUserIdChatId()
  pdf_filename = f"{title.strip()}.pdf"
  md_filename = f"{title.strip()}.md"
  object_name = f"{user_id}/{chat_id}/{pdf_filename}"
  rprint(f"[green]Saving {object_name} to the bucket...[green]")
  try:
    with open(md_filename, "w", encoding="utf-8") as f:
        f.write(content)
    client = Minio(
      endpoint=MINIO_URL.replace("http://", "").replace("https://", ""),
      access_key=MINIO_ACCESS_KEY,
      secret_key=MINIO_SECRET_KEY,
      secure=False
    )
    document = Document()
    document.LoadFromFile(md_filename, FileFormat.Markdown)
    document.SaveToFile(pdf_filename, FileFormat.PDF)
    document.Close()
    tags = Tags(for_object=True)
    tags["user_id"] = user_id
    tags["chat_id"] = chat_id
    tags["type"] = "GenerateContent"
    client.fput_object(
        bucket_name=MINIO_BUCKET_NAME,
        object_name=pdf_filename,
        file_path=pdf_filename,
        tags=tags,
        content_type="application/pdf"
    )
    os.remove(md_filename)
    os.remove(pdf_filename)
  except Exception as e:
    rprint(f"[red]Error saving file to bucket...\n {e}[red]")
    if os.path.exists(md_filename):
        os.remove(md_filename)
    if os.path.exists(pdf_filename):
        os.remove(pdf_filename)
    return f"Error saving file: {e}"
  finally:
    rprint(f"[green]{pdf_filename} Saved to the bucket[green]")
    return f"Content saved to Minio bucket {MINIO_BUCKET_NAME} with object name {object_name}"

class SaveContentInput(BaseModel):
  content: str = Field(..., description="content to be saved in a file")
  title: str = Field(..., description="title of the content")

SaveContentTool = StructuredTool(
  func=saveContent,
  name="SaveContent",
  description="""Use this tool to save generated content in a file in pdf format
  INPUT format: {{"content":"content in string format", 'title": "title of the content in string format"}}""",
  args_schema=SaveContentInput
)