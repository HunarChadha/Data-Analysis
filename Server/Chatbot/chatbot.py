from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
load_dotenv()

KEY = os.environ["GEMINI_API_KEY"]

client = genai.Client(api_key=KEY)

MODEL = "gemini-3.6-flash"
CONFIG = types.GenerateContentConfig(
    thinking_config=types.ThinkingConfig(thinking_level="low"),
    temperature=0.2,
)

class Response:
    @staticmethod
    async def response(content: str, model: str = MODEL) -> str:
        res = await client.aio.models.generate_content(
            model=model,
            contents=content,
            config=CONFIG,
        )
        return res.text

    @staticmethod
    async def stream(content: str, model: str = MODEL):
        try:
            async for chunk in await client.aio.models.generate_content_stream(
                model=model,
                contents=content,
                config=CONFIG,
            ):
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            print(f"Chatbot stream error: {type(e).__name__}: {e}")
            yield "\n\n_(Connection to the AI was interrupted mid-answer. Please try again.)_"