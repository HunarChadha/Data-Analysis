from fastapi import Response, status
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from AI.main import Main
from userdata import Connection
from Chatbot.chatbot import Response as AIResponse
import init

app = FastAPI()

app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:5173"],allow_methods=["*"],allow_headers=["*"])
database = Connection()
database.connect()

@app.get("/")
def read_root():
    return {"messgae": "Server is Running"}

@app.post("/dashboard")
async def analyze(file: UploadFile = File(...)):
    data = await file.read()
    print(file.content_type)
    return Main.main(data, file.content_type)

@app.post("/Welcome")
async def getuserInfo(data: init.UserInfo):
    data = {'username': data.username, 'email': data.email, 'password': data.password}
    return database.send_info("DATA", data)

@app.post("/login")
async def login_user(info:init.LoginInfo):
    email, password = info.email, info.password
    return database.login(email, password)

@app.post("/chatbot")
async def getMessage(message: init.Message):
    async def generate():
        async for chunk in AIResponse.stream(content=message.prompt):
            yield chunk
    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")

@app.post("/chatbot/chats")
async def getUserID(user_id: init.UserID):
    return database.fetch_chat(int(user_id.user_id))

@app.post("/chatbot/message")
async def getChatMessage(conv_id:init.ConvID):
    return database.fetch_chat_message(int(conv_id.conv_id), int(conv_id.user_id))

@app.post("/chatbot/saveChat")
async def saveChat(chats:list[init.ChatMessage]):
    conv_id = chats[0].CONVERSATION_ID
    user_id = chats[0].USER_ID
    return database.save_chat(chats, conv_id, user_id) or "okay"

@app.post("/chatbot/saveConv")
async def saveConv(conv_info:init.Conv):
    return database.save_conv(conv_info)