from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from app.services.task_enricher import parse_jd_to_template, generate_skill_md_from_template, polish_text
from app.services.doc_parser import parse_document

router = APIRouter()


class JDInput(BaseModel):
    job_title: str
    job_description: str
    daily_tasks: list[str]


class TaskTemplate(BaseModel):
    id: int
    name: str
    description: str = ""
    frequency: str = ""
    tools_systems: str = ""
    file_paths: str = ""
    contacts: str = ""
    kpi: str = ""
    automation_potential: str = "unknown"


class ProjectTemplate(BaseModel):
    id: int
    name: str
    description: str = ""
    tasks: list[TaskTemplate]


class TemplateInput(BaseModel):
    job_title: str
    department: str = ""
    summary: str = ""
    employee_name: str | None = None
    projects: list[ProjectTemplate]
    qualifications: list[str] = []
    skills_mentioned: list[str] = []


@router.post("/parse-jd")
async def parse_jd(input: JDInput):
    try:
        template = await parse_jd_to_template(
            job_title=input.job_title,
            job_description=input.job_description,
            daily_tasks=input.daily_tasks,
        )
        return template
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-jd")
async def upload_jd(file: UploadFile = File(...)):
    if not file.filename.endswith((".docx", ".pdf")):
        raise HTTPException(status_code=400, detail="Only .docx and .pdf files are supported")

    try:
        content = await file.read()
        parsed = parse_document(content, file.filename)

        template = await parse_jd_to_template(
            job_title=parsed["job_title"],
            job_description=parsed["job_description"],
            daily_tasks=parsed["daily_tasks"],
        )
        return template
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PolishInput(BaseModel):
    text: str


@router.post("/polish", response_class=PlainTextResponse)
async def polish(input: PolishInput):
    try:
        return await polish_text(input.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-skill", response_class=PlainTextResponse)
async def generate_skill(input: TemplateInput):
    try:
        skill_md = await generate_skill_md_from_template(
            template=input.model_dump(),
            employee_name=input.employee_name,
        )
        return skill_md
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
