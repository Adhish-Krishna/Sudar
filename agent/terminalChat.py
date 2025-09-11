from .sudar import SUDARAgent
from dotenv import load_dotenv
from .services import ChatService
from .utils import getUserIdChatId

def chat():
    user_id, chat_id = getUserIdChatId()
    thread_id = f"{user_id}_{chat_id}"

    service = ChatService(db_name="SUDAR", collection_name="chat_history")

    agent = SUDARAgent()
    compiled_agent = agent.get_agent()
    config = {
        "configurable":{
            "thread_id":thread_id #should be actual chat_id
        }
    }
    while True:
        user_input = input("User:")
        service.insertHumanMessage(user_input, user_id, chat_id)
        if user_input.strip().lower() == "exit" or user_input.strip().lower() == 'quit':
            break
        else:
            for chunk in compiled_agent.stream(
                {
                    "messages":[
                        {
                            "role": "user",
                            "content":user_input
                             
                        }
                    ]
                },
                config=config,
                stream_mode="updates",
            ):
                agents = ["supervisor", "ContentResearcher", "WorksheetGenerator"]
                for ag in agents:
                    if ag in chunk:
                        service.insertAIMessage(
                            message = chunk[ag]["messages"][-1].content,
                            user_id= user_id,
                            chat_id = chat_id,
                            agent_name=ag
                        )
                        print(chunk[ag]["messages"][-1].content)
                        break

if __name__ == "__main__":
    chat()