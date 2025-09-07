from ..tools import RAG

context = RAG(filepath="C:\\Users\\strea\\Downloads\\OneCreditCourseForm.docx", query="who is enrolled in this course")
print(context)