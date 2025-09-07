from ..tools import ChunkDocument
from langchain_community.vectorstores.utils import filter_complex_metadata

chunker = ChunkDocument(filepath="C:\\Users\\strea\\Downloads\\OneCreditCourseForm.docx")
chunker.parseDocument()
documents = filter_complex_metadata(chunker.docs)
print(documents[0])