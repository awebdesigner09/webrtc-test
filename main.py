from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi import staticfiles
from manager import MeetingManager
from fastapi.websockets import WebSocket,WebSocketDisconnect



app = FastAPI()
meeting_manager = MeetingManager()

templates = Jinja2Templates(directory="templates")
app.mount("/static", staticfiles.StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home(request: Request):
    return templates.TemplateResponse(request= request, name= "home.html")

@app.websocket("/ws/{client_id}")
async def connet_websocket(websocket: WebSocket, client_id: str):
    await meeting_manager.join(client_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await meeting_manager.rooms[client_id].broadcast(data, websocket)
    except WebSocketDisconnect:
        meeting_manager.leave(client_id, websocket)


@app.get("/room/{roomName}")
def get_video(request: Request, roomName:str):
    return templates.TemplateResponse(request=request, name="index.html")