from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/login")
def login(request: LoginRequest):

    if (
        request.username == "admin"
        and request.password == "123456"
    ):
        return {
            "accessToken": "fake-jwt-token"
        }

    raise HTTPException(
        status_code=401,
        detail="Invalid username or password"
    )
