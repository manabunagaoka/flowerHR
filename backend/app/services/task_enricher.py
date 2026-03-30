import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

PARSE_TO_TEMPLATE_PROMPT = """You are an expert HR analyst. Given a job description, extract all information into a structured template organized by projects/responsibility areas.

Group related tasks under projects. A project is a major area of responsibility (e.g. "Media Distribution", "Consumer Products", "Licensing").

Return valid JSON only, no markdown. Format:
{
  "job_title": "extracted title",
  "department": "extracted or best guess",
  "employee_name": "extracted name if found in document, otherwise empty string",
  "summary": "1-2 sentence role summary",
  "projects": [
    {
      "id": 1,
      "name": "Project/Area name",
      "description": "What this responsibility area covers",
      "tasks": [
        {
          "id": 1,
          "name": "short task name",
          "description": "what was written in the JD about this task",
          "frequency": "",
          "tools_systems": "",
          "file_paths": "",
          "contacts": "",
          "kpi": "",
          "automation_potential": "unknown"
        }
      ]
    }
  ],
  "qualifications": ["extracted qualifications"],
  "skills_mentioned": ["skills explicitly mentioned in JD"]
}

Rules:
- Group tasks under logical projects based on the JD structure
- If the JD has section headers like "Consumer Products:", "Licensing:", use those as project names
- Each task should belong to exactly one project
- Pre-fill description from what the JD says
- Leave frequency, tools_systems, file_paths, contacts, kpi as empty strings
- automation_potential should be "unknown"
- Use sequential IDs: projects start at 1, tasks within each project start at 1
- Be thorough — extract ALL tasks
- If the document contains the employee's name, extract it into employee_name
- employee_name can be any format (first name only, full name, etc.)"""


POLISH_PROMPT = """You are a professional editor. Given a text field from an HR document, improve it:
- Fix grammar and spelling errors
- Make it clear and concise
- Use professional HR language
- Keep the same meaning and intent
- Do not add information that wasn't there

Return only the improved text, nothing else."""


async def polish_text(text: str) -> str:
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": POLISH_PROMPT},
            {"role": "user", "content": text},
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content

GENERATE_PROMPT = """You are an expert HR analyst. Given a completed job template with specific task details organized by projects, generate a SKILL.md.

For each task, based on the details provided, determine:
- [AUTOMATABLE] — an AI agent can fully handle this with the info given
- [SEMI-AUTO] — needs human judgment but agent can assist
- [HUMAN-ONLY] — requires human presence, relationships, or judgment

The SKILL.md must follow this format:

# SKILL.md — {job_title}

## Profile
- **Name:** {employee_name or "TBD"}
- **Role:** {job_title}
- **Department:** {department}
- **Generated:** {date}

## Core Skills
List skills with proficiency: Beginner | Intermediate | Advanced | Expert
Format: - **Skill Name** [Level] — one line description

## Projects & Tasks

For each project:
### Project: {project name}
{project description}

For each task within the project:
#### {task name}
- **Automation:** [AUTOMATABLE] / [SEMI-AUTO] / [HUMAN-ONLY]
- **Description:** What this task involves
- **Frequency:** How often
- **Systems/Tools:** Specific tools, software, platforms
- **File Locations:** Exact folders and file paths
- **Key Contacts:** Who to coordinate with
- **KPI:** How success is measured
- **Agent Instructions:** Specific step-by-step for an agent (if automatable/semi-auto)
- **Human Action:** What a human must do (if human-only/semi-auto)

## Skill Dependencies
Which skills build on others.

## Agent Handoff Summary
Prioritized list of what can be automated immediately vs needs human oversight vs must stay human.
"""


async def parse_jd_to_template(
    job_title: str,
    job_description: str,
    daily_tasks: list[str],
) -> dict:
    tasks_formatted = "\n".join(f"- {t}" for t in daily_tasks) if daily_tasks else "None provided"

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": PARSE_TO_TEMPLATE_PROMPT},
            {"role": "user", "content": f"Job Title: {job_title}\n\nJob Description:\n{job_description}\n\nDaily Tasks:\n{tasks_formatted}"},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


async def generate_skill_md_from_template(
    template: dict,
    employee_name: str | None = None,
) -> str:
    from datetime import date

    projects_detail = ""
    for project in template.get("projects", []):
        projects_detail += f"\n## Project: {project['name']}\n"
        projects_detail += f"Description: {project.get('description', '')}\n"
        for task in project.get("tasks", []):
            projects_detail += f"""
### {task['name']}
- Description: {task.get('description', '')}
- Frequency: {task.get('frequency', 'Not specified')}
- Tools/Systems: {task.get('tools_systems', 'Not specified')}
- File Paths: {task.get('file_paths', 'Not specified')}
- Contacts: {task.get('contacts', 'Not specified')}
- KPI: {task.get('kpi', 'Not specified')}
"""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": GENERATE_PROMPT},
            {"role": "user", "content": f"""Job Title: {template.get('job_title', 'Unknown')}
Department: {template.get('department', 'Unknown')}
Employee Name: {employee_name or 'TBD'}
Date: {date.today().isoformat()}
Summary: {template.get('summary', '')}

Qualifications: {', '.join(template.get('qualifications', []))}
Skills Mentioned: {', '.join(template.get('skills_mentioned', []))}

{projects_detail}

Generate the SKILL.md now."""},
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content
