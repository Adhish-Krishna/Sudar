from tools.RAG.RAG import RAG

context = RAG(r"{}".format(input("Enter the file path: ")),input("Enter your Query: "))

print(context)