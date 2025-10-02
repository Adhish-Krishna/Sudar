from .sudar import SUDARCrew
from .services import ChatService
from .utils import getUserIdChatId
import asyncio

async def chat_async():
    """
    Simple terminal chat interface for SUDAR AI Agent
    """
    user_id, chat_id = getUserIdChatId()
    
    # ChatService remains unchanged - still saves to MongoDB
    service = ChatService(db_name="SUDAR", collection_name="chat_history")
    
    # Initialize CrewAI-based SUDAR crew
    crew = SUDARCrew(user_id=user_id, chat_id=chat_id)
    
    print("\nSUDAR AI Educational Assistant")
    print("Type 'exit' or 'quit' to end session\n")
    
    while True:
        try:
            # Get user input (sync operation)
            user_input = await asyncio.to_thread(input, "\n[You]: ")
            
            if user_input.strip().lower() in ["exit", "quit"]:
                print("\nGoodbye!\n")
                break
            
            if not user_input.strip():
                continue
            
            # Save user message to MongoDB (unchanged!)
            service.insertHumanMessage(user_input, user_id, chat_id)
            
            # Execute crew with streaming
            print("\nProcessing...\n")
            
            try: 
                result = crew.kickoff(inputs={"query": user_input})
                full_response = result.raw if hasattr(result, 'raw') else str(result)
                if full_response:
                    print(f"\n\n[SUDAR]:\n{full_response}\n")
                    
                    # Save AI response to MongoDB (unchanged!)
                    service.insertAIMessage(
                        message=full_response,
                        user_id=user_id,
                        chat_id=chat_id,
                        agent_name="SUDARCrew"
                    )
                else:
                    print("\nNo response generated\n")
                
            except Exception as e:
                error_msg = f"Error executing crew: {str(e)}"
                print(f"\nError: {error_msg}\n")
                service.insertAIMessage(
                    message=error_msg,
                    user_id=user_id,
                    chat_id=chat_id,
                    agent_name="SUDARCrew_Error"
                )
                
        except KeyboardInterrupt:
            print("\n\nSession interrupted. Goodbye!\n")
            break
        except Exception as e:
            print(f"\nUnexpected error: {str(e)}\n")

def chat():
    """
    Synchronous wrapper for async chat function
    """
    asyncio.run(chat_async())

if __name__ == "__main__":
    chat()