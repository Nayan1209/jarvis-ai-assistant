import httpx
from fastapi import HTTPException

from app.config import Settings
from app.models import ChatMessage


class OpenAIClient:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def ask(self, message: str, history: list[ChatMessage]) -> str:
        if not self.settings.openai_api_key:
            raise HTTPException(
                status_code=500,
                detail="OPENAI_API_KEY is not configured on the backend.",
            )

        payload = {
            "model": self.settings.openai_model,
            "messages": [
                {
                    "role": "system",
                    "content": self._system_prompt(),
                },
                *[item.model_dump() for item in history[-12:]],
                {
                    "role": "user",
                    "content": message,
                },
            ],
            "temperature": 0.7,
        }

        headers = {
            "Authorization": f"Bearer {self.settings.openai_api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text[:500]
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=f"AI provider returned an error: {detail}",
            ) from exc
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=502,
                detail="Could not reach the AI provider.",
            ) from exc

        data = response.json()
        answer = data["choices"][0]["message"]["content"].strip()
        return answer

    def _system_prompt(self) -> str:
        return (
            f"You are {self.settings.assistant_name}, a polished voice-first AI assistant. "
            "Answer clearly, helpfully, and conversationally. Keep voice replies concise by default. "
            "When the user asks for steps, give practical numbered instructions. "
            "Do not claim to control devices unless an integration is explicitly available."
        )
