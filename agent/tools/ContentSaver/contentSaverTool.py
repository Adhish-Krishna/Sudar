from pydantic import BaseModel, Field
from langchain_core.tools import StructuredTool
from minio import Minio
from envconfig import MINIO_ACCESS_KEY, MINIO_BUCKET_NAME, MINIO_SECRET_KEY, MINIO_URL, MD_TO_PDF_URL
import requests
from ...utils import getUserIdChatId
from minio.commonconfig import Tags
import os
from rich import print as rprint
import tempfile

def saveContent(content: str, title: str)->str:
  user_id, chat_id = getUserIdChatId()
  pdf_filename = f"{title.strip()}.pdf"
  object_name = f"{user_id}/{chat_id}/{pdf_filename}"
  rprint(f"[green]Saving {object_name} to the bucket...[green]")
  
  temp_md_file = None
  temp_pdf_file = None
  
  try:
    # Create temporary markdown file
    temp_md_file = tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8')
    temp_md_file.write(content)
    temp_md_file.close()
    
    # Send POST request to md-to-pdf webservice
    with open(temp_md_file.name, 'rb') as f:
      files = {'markdown': (f"{title.strip()}.md", f, 'text/markdown')}
      response = requests.post(MD_TO_PDF_URL, files=files)
      response.raise_for_status()
    
    # Save received PDF to temporary file
    temp_pdf_file = tempfile.NamedTemporaryFile(mode='wb', suffix='.pdf', delete=False)
    temp_pdf_file.write(response.content)
    temp_pdf_file.close()
    
    # Upload to MinIO
    client = Minio(
      endpoint=MINIO_URL.replace("http://", "").replace("https://", ""),
      access_key=MINIO_ACCESS_KEY,
      secret_key=MINIO_SECRET_KEY,
      secure=False
    )
    
    tags = Tags(for_object=True)
    tags["user_id"] = user_id
    tags["chat_id"] = chat_id
    tags["type"] = "GeneratedPDFContent"
    
    client.fput_object(
        bucket_name=MINIO_BUCKET_NAME,
        object_name=object_name,
        file_path=temp_pdf_file.name,
        tags=tags,
        content_type="application/pdf"
    )
    
  except Exception as e:
    rprint(f"[red]Error saving file to bucket...\n {e}[red]")
    return f"Error saving file: {e}"
  finally:
    # Clean up temporary files
    if temp_md_file and os.path.exists(temp_md_file.name):
      try:
        os.remove(temp_md_file.name)
      except Exception as cleanup_err:
        rprint(f"[red]Error removing temporary markdown file: {cleanup_err}[red]")
    
    if temp_pdf_file and os.path.exists(temp_pdf_file.name):
      try:
        os.remove(temp_pdf_file.name)
      except Exception as cleanup_err:
        rprint(f"[red]Error removing temporary PDF file: {cleanup_err}[red]")
    
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