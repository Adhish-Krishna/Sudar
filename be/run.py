"""
Simple runner script to avoid module import warnings
"""
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

PORT = os.getenv("PORT", "3006")

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=int(PORT), reload=True)
