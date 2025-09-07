from .sudar import SUDARAgent

def chat():
    agent = SUDARAgent()
    compiled_agent = agent.get_agent()
    config = {
        "configurable":{
            "thread_id":"1"
        }
    }
    while True:
        user_input = input("User:")
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
                        print(chunk[ag]["messages"][-1].content)
                        break

if __name__ == "__main__":
    chat()