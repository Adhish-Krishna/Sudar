from pydantic import BaseModel, Field
from langchain_core.tools import StructuredTool
from minio import Minio
from envconfig import MINIO_ACCESS_KEY, MINIO_BUCKET_NAME, MINIO_SECRET_KEY, MINIO_URL
import fitz
from ...utils import getUserIdChatId
from minio.commonconfig import Tags
import os
from rich import print as rprint
import markdown
import tempfile

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
    # Convert markdown to HTML
    html_content = markdown.markdown(content)
    
    # Create a temporary HTML file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as temp_html:
        temp_html_name = temp_html.name
        html_full = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; }}
                h1 {{ color: #2c3e50; font-size: 24px; margin-top: 0; padding-bottom: 10px; border-bottom: 1px solid #eee; }}
                h2 {{ color: #3498db; font-size: 20px; margin-top: 20px; }}
                h3 {{ color: #2c3e50; font-size: 18px; margin-top: 15px; }}
                p {{ line-height: 1.6; margin: 10px 0; }}
                pre {{ background-color: #f8f8f8; padding: 12px; border-radius: 5px; border: 1px solid #e0e0e0; overflow-x: auto; }}
                code {{ font-family: Consolas, Monaco, 'Andale Mono', monospace; }}
                ul, ol {{ padding-left: 20px; }}
                li {{ margin: 5px 0; }}
                table {{ border-collapse: collapse; width: 100%; margin: 15px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                img {{ max-width: 100%; }}
            </style>
        </head>
        <body>
            <h1>{title}</h1>
            {html_content}
        </body>
        </html>
        """
        temp_html.write(html_full)
    
    pdf_document = None
    try:
        # Create a PDF from the HTML using PyMuPDF
        pdf_document = fitz.open()
        # Create an A4 page (width=595, height=842 points)
        page = pdf_document.new_page(width=595, height=842)
        
        # Load HTML from file for better rendering
        with open(temp_html_name, 'r', encoding='utf-8') as html_file:
            html_content = html_file.read()
            
        # Insert the HTML content into the PDF using insert_htmlbox
        # Define a rectangle that covers most of the page with margins
        rect = fitz.Rect(50, 50, 550, 750)
        
        # Add the HTML content to the PDF
        page.insert_htmlbox(rect, html_content)
        
        # Save the PDF
        pdf_document.save(pdf_filename)
    except Exception as e:
        rprint(f"[red]Error creating PDF: {e}[red]")
        raise e
    finally:
        # Close the PDF document if it was created
        if pdf_document:
            pdf_document.close()
        # Clean up the temporary HTML file
        if os.path.exists(temp_html_name):
            os.remove(temp_html_name)
    
    tags = Tags(for_object=True)
    tags["user_id"] = user_id
    tags["chat_id"] = chat_id
    tags["type"] = "GenerateContent"
    client.fput_object(
        bucket_name=MINIO_BUCKET_NAME,
        object_name=object_name,
        file_path=pdf_filename,
        tags=tags,
        content_type="application/pdf"
    )
    os.remove(md_filename)
    os.remove(pdf_filename)
  except Exception as e:
    rprint(f"[red]Error saving file to bucket...\n {e}[red]")
    # Clean up temporary files
    for filename in [md_filename, pdf_filename]:
        if os.path.exists(filename):
            try:
                os.remove(filename)
            except Exception as cleanup_err:
                rprint(f"[red]Error removing temporary file {filename}: {cleanup_err}[red]")
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