from fastapi import FastAPI
from .auth import router as auth_router
from .classroom import router as classroom_router
from .logout import router as logout_router
from .forgot_password import router as forgot_password_router

app = FastAPI()
app.include_router(auth_router)
app.include_router(classroom_router)
app.include_router(logout_router)
app.include_router(forgot_password_router)
