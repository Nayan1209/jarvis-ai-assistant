from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings, get_settings
from app.models import ChatRequest, ChatResponse
from app.openai_client import OpenAIClient


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Jarvis AI Assistant API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/api/chat", response_model=ChatResponse)
    async def chat(
        request: ChatRequest,
        app_settings: Settings = Depends(get_settings),
    ) -> ChatResponse:
        client = OpenAIClient(app_settings)
        answer = await client.ask(request.message, request.history)
        return ChatResponse(answer=answer, model=app_settings.openai_model)

    return app


app = create_app()
