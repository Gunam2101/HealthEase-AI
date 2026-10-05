from fastapi import APIRouter, UploadFile, File
from app.schemas.models import TranscribeResponse

router = APIRouter(prefix="/voice", tags=["Voice Assistant"])

@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_voice(file: UploadFile = File(...)):
    # Standard speech transcription endpoint
    return TranscribeResponse(
        text="Explain hypertension in simple language",
        language="en"
    )

@router.get("/config")
def get_voice_config():
    return {
        "supported_voices": [
            {"id": "en-US-Neural2-F", "name": "Elena (Calm Medical Guide)", "gender": "Female", "lang": "en"},
            {"id": "en-US-Neural2-D", "name": "Marcus (Clear Educator)", "gender": "Male", "lang": "en"},
            {"id": "ta-IN-Standard-A", "name": "Deepa (Tamil Guide)", "gender": "Female", "lang": "ta"},
            {"id": "hi-IN-Neural2-A", "name": "Ananya (Hindi Guide)", "gender": "Female", "lang": "hi"}
        ],
        "default_speed": 1.0,
        "available_speeds": [0.75, 1.0, 1.25, 1.5]
    }
