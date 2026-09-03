from pydantic import BaseModel

class UserInfo(BaseModel):
    username: str
    password: str
    email: str

class Message(BaseModel):
    prompt:str

class UserID(BaseModel):
    user_id:str

class ConvID(BaseModel):
    conv_id:str
    user_id:str

class LoginInfo(BaseModel):
    email:str
    password:str

class ChatMessage(BaseModel):
    ROLE: str
    USER_ID: int
    CONVERSATION_ID: int
    CONTENT: str
    IND: int

class Conv(BaseModel):
    title:str
    user_id:int