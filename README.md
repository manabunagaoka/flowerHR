# flowerHR

> A Flower agent plugin: Job Description + Day-to-Day Tasks → SKILL.md

Part of the [Flower](https://github.com/manabunagaoka/flower) plugin suite.
Published via [Manaboodle](https://manaboodle.com).

## What it does

HR provides:
- Job Title
- Job Description
- List of day-to-day tasks

flowerHR outputs:
- `SKILL.md` — structured skill profile with proficiency levels, task-skill mapping, and agent handoff notes

## Structure

```
flowerHR/
├── backend/          # FastAPI — skill extraction logic
│   ├── app/
│   │   ├── api/      # Routes
│   │   └── services/ # AI extraction
│   └── skills/
│       └── jd-to-skill/
│           └── skill.json  # MCP manifest
└── frontend/         # Next.js — HR input UI
```

## Quick Start

### Backend
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your OPENAI_API_KEY
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Roadmap
- [ ] Employee profile management
- [ ] Skill inheritance model
- [ ] Skill gap analysis (JD vs employee)
- [ ] MCP server endpoint
- [ ] Claude Cowork plugin
- [ ] SSO support (for enterprise clone)
