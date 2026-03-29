from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from app.services.skill_extractor import extract_skill_md

router = APIRouter()

class JDInput(BaseModel):
    job_title: str
    job_description: str
    daily_tasks: list[str]
    employee_name: str | None = None

@router.post("/generate-skill", response_class=PlainTextResponse)
async def generate_skill(input: JDInput):
    try:
        skill_md = await extract_skill_md(
            job_title=input.job_title,
            job_description=input.job_description,
            daily_tasks=input.daily_tasks,
            employee_name=input.employee_name,
        )
        return skill_md
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
