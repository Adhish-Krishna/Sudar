from ..tools import ChunkDocument
from langchain_community.vectorstores.utils import filter_complex_metadata

chunker = ChunkDocument(object_key="23N503EmbeddedSystemsUART.pdf")
chunker.parseDocument()
documents = filter_complex_metadata(chunker.docs)
print(documents[0])