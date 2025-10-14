from fastapi import APIRouter

router = APIRouter()

@router.post("/logout")
def logout_teacher():
    return {"message": "Logout successful. Please delete your token on the client."}
