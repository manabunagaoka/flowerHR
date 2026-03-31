import os
from typing import Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are an expert HR analyst. Given a job title, job description, and list of daily tasks, extract and structure a SKILL.md file.

The SKILL.md must follow this exact format:

# SKILL.md — {job_title}

## Profile
- **Name:** {employee_name or "TBD"}
- **Role:** {job_title}
- **Generated:** {date}

## Core Skills
List skills with proficiency: Beginner | Intermediate | Advanced | Expert
Format: - **Skill Name** [Level] — one line description

## Task-Skill Mapping
| Task | Required Skills |
|------|----------------|
| task | skill1, skill2 |

## Skill Dependencies
Skills that inherit from or build upon each other.
Format: - **SkillA** → requires **SkillB**

## Agent Handoff Notes
What an agent taking over this role needs to know to perform the tasks.

Be specific, practical, and concise. Focus on actionable skills an agent or successor can use."""

async def extract_skill_md(
    job_title: str,
    job_description: str,
    daily_tasks: list[str],
    employee_name: Optional[str] = None,
) -> str:
    from datetime import date

    tasks_formatted = "\n".join(f"- {t}" for t in daily_tasks)

    user_prompt = f"""Job Title: {job_title}

Job Description:
{job_description}

Daily Tasks:
{tasks_formatted}

Employee Name: {employee_name or "TBD"}
Date: {date.today().isoformat()}

Generate the SKILL.md now."""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content
