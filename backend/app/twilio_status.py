from fastapi import APIRouter, Form
from fastapi.responses import PlainTextResponse

router = APIRouter(prefix="/twilio", tags=["twilio"])

@router.post("/status", response_class=PlainTextResponse)
async def status(
    MessageSid: str = Form(...),
    MessageStatus: str = Form(...),  # queued|sent|delivered|undelivered|failed
    To: str = Form(None),
    ErrorCode: str = Form(None),
):
    # For now just log. Later: update notifications table.
    print({"sid": MessageSid, "status": MessageStatus, "to": To, "error": ErrorCode})
    return "OK"
