from .services import ChatService
from .utils import getUserIdChatId

service = ChatService(db_name="SUDAR", collection_name="chat_history")

user_id, chat_id = getUserIdChatId()

print("Get all user chats")
print(service.getUserChatList(user_id))

print("Get user chat")
print(service.getUserChat(user_id, chat_id))

print("Get Chat Summary")
print(service.getChatSummary(user_id, chat_id))

