from pydantic import BaseModel

class SignUpUser(BaseModel):
    userid: str
    password: str
    email: str = None
