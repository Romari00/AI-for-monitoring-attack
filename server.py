from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import re

class AnalyzeEventRequest(BaseModel):
    event: str
    source_ip: str
    severity: str
    protocol: str
    number: str


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def ask_llama_locally(prompt, model_name="llama3.2:3b"):
    try:
        result = subprocess.run(
            ["ollama", "run", model_name],
            input=prompt,
            capture_output=True,
            text=True,
            check=True,
            encoding="utf-8"
        )
        clean_output = re.sub(r"[*\"]", "", result.stdout.strip())
        clean_output = clean_output.replace("\n", "<br>")
        return clean_output
    except subprocess.CalledProcessError as e:
        return f"Ошибка: {e.stderr.strip()}"
    except Exception as e:
        return f"Произошла ошибка: {e}"


@app.post("/analyze_event/")
async def analyze_event(request: AnalyzeEventRequest):
    if not request.event or not request.source_ip or not request.severity:
        raise HTTPException(status_code=400, detail="Некорректные данные")

    prompt = f"""
    Ты — эксперт по информационной безопасности. Дай анализ события, используя **только литературный и технический русский язык**. 
    **Запрещено использовать иностранные слова, смешанный синтаксис или транслит**.

    **Формат ответа:**
    1. **Описание угрозы**: Опиши, что представляет собой событие {request.event} (только факты без истории).
    2. **Опасность**: Оцени потенциальный ущерб и критичность.
    3. **Рекомендации**: Дай конкретные шаги по устранению угрозы и рекомендации по повышению защищенности объекта контроля.

    **Данные события**:
    - Название: {request.event}
    - IP-адрес источника: {request.source_ip}
    - Критичность: {request.severity}
    """

    response = ask_llama_locally(prompt)

    return {
        "message": f"Анализ завершен для события {request.number}: {request.event}",
        "response": response
    }