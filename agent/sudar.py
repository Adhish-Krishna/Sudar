from langchain_ollama import ChatOllama
from langgraph_supervisor import create_supervisor
from .tools import DocumentRetrieverTool, WebSearchTool, WebScraperTool, SaveContentTool
from langchain_google_genai import ChatGoogleGenerativeAI
from .subagents import ReActSubAgent
from .prompts import contentResearcherPrompt, worksheetGeneratorPrompt, supervisorPrompt
from langchain_groq import ChatGroq
from langgraph.checkpoint.mongodb import MongoDBSaver
from pymongo import MongoClient
from envconfig import GOOGLE_API_KEY, GOOGLE_MODEL_NAME, OLLAMA_MODEL, MODEL_PROVIDER, GROQ_API_KEY, GROQ_MODEL_NAME, MONGO_DB_URI

class SUDARAgent:
    def __init__(self):

        self.llm_model = ChatOllama(model = OLLAMA_MODEL)
        if MODEL_PROVIDER == 'groq':
            self.llm_model = ChatGroq(model = GROQ_MODEL_NAME)
        elif MODEL_PROVIDER == 'google':
            self.llm_model = ChatGoogleGenerativeAI(model=GOOGLE_MODEL_NAME)

        self.client = MongoClient(MONGO_DB_URI)
        self.memory = MongoDBSaver(
            client=self.client,
            connection_string=MONGO_DB_URI,
            db_name="SUDAR"
        )
   
        self.AGENT_CONFIG = {
            "temperature": 0.7,
            "max_tokens": 2048,
            "system_name": "Sudar AI Educational Assistant",
            "version": "1.0.0"
        }

        self.content_researcher = ReActSubAgent()
        self.worksheet_generator = ReActSubAgent()
    
        self.orchestrator = create_supervisor(
            agents = [self.content_researcher(self.llm_model, "ContentResearcher",[DocumentRetrieverTool, WebScraperTool, WebSearchTool], contentResearcherPrompt), self.worksheet_generator(self.llm_model, "WorksheetGenerator", [SaveContentTool], worksheetGeneratorPrompt)],
            model = self.llm_model,
            tools=[SaveContentTool],
            prompt = supervisorPrompt,
            add_handoff_back_messages=True,
            output_mode="full_history"
        )

    def get_agent(self):
        return self.orchestrator.compile(checkpointer=self.memory)








