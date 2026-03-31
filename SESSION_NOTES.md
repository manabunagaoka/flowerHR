# flowerHR Session Notes

## Session 1 — 2026-03-29

### What was built
- Repo created: https://github.com/manabunagaoka/flowerHR
- Stack: Next.js frontend + FastAPI backend
- Upload JD (.docx/.pdf) or manual entry
- AI parses JD into structured template: Projects → Tasks
- Each task has: name, description, frequency, tools/systems, file paths, contacts, KPI
- AI sparkle button for grammar/spelling polish on any text field
- Auto-resize textareas for descriptions
- Delete confirmation on tasks and projects (inside expanded view)
- Employee name extracted from JD or filled manually (top of template)
- Generates SKILL.md with automation tagging (AUTOMATABLE / SEMI-AUTO / HUMAN-ONLY)
- Separate download for JD and SKILL.md from result page
- Flower logo in header

### Architecture decisions
- Separate repo from Flower — employer clones this, never sees Flower
- flower[X] naming convention: Flower is the agent, plugins named flowerHR, flowerTaskFlow, etc.
- hanaandflower.ai = sync/perception engine, Flower has a role in it
- manaboodle.com = storefront/publisher for all tools
- MCP server design from day one for Claude Cowork compatibility
- Using OpenAI API (gpt-4o) for now, considering Anthropic switch

### Dev environment setup
- Installed: Xcode CLI tools, Homebrew, gh CLI, Node.js, Python 3
- Backend runs on port 8000 (uvicorn)
- Frontend runs on port 3000 (next dev)
- Python venv at ~/flowerHR/venv

## Session 2 — 2026-03-29

### What was built
- Rebranded: "JD / Skills" under "Cadence by Manaboodle" umbrella
- Dark pro UI matching Cadence landing page (warm tones, olive/golden accents)
- Removed Flower logo — text-only branding
- New 3-step flow: JD Input → Projects/Tasks → Results
- Step 2: Projects/Tasks page with upload/manual editing, pre-populated from JD
- Downloadable task template (.docx) pre-filled with project names from JD
- Upload filled template back for AI parsing
- Results page: 3 side-by-side preview panes (JD, Tasks, SKILL.md)
- 4 download formats: JD (.docx), Tasks (.docx), Tasks (.json for TaskFlow), SKILL.md
- "Load Sample" button for demo — one-click fills realistic Marketing Manager data
- Fixed Python 3.9 compatibility (Optional[] instead of | syntax)
- Created backend .env for API key
- Installed Node.js and Python venv from scratch

### New API endpoints
- POST /api/generate-task-template — downloadable Word template
- POST /api/parse-task-doc — parse uploaded task doc
- POST /api/download-tasks-docx — formatted task list as Word
- POST /api/download-tasks-json — structured JSON for TaskFlow import
- POST /api/download-jd-docx — JD as Word doc

### Architecture decisions
- Suite naming: Cadence (umbrella) → JD/Skills, TaskFlow, Performance Review
- JD/Skills is the feeder tool — outputs flow into TaskFlow and Review
- JSON export designed for TaskFlow import compatibility
- Two-input model: HR provides JD (structure), employee provides tasks (detail)
- Performance Review is a separate future plugin, not part of JD/Skills

### Product thinking
- JD alone is "garbage" — too vague for actionable SKILL.md
- Breaking JD into Projects→Tasks makes automation tagging meaningful
- Template download/upload loop: we control the format, AI parsing is reliable
- Tool becomes stateful in future (Supabase): JD saved during recruiting, tasks added when hired
- Gap analysis opportunity: JD says X but employee doesn't do it, or vice versa

### Next session plan
- Deploy: backend on Render, frontend on Vercel
- Test with real company JD docs from team members
- Add Supabase for persistence (save/load per employee, dashboard view)

### Future roadmap
- JD Wizard (help HR write better, more specific JDs)
- Link to performance goals / KPI measurement from JD → tasks
- TaskFlow integration (assign agents to automatable tasks)
- MCP server endpoint
- Claude Cowork plugin packaging
- SSO support for enterprise clone
- White-label config (logo, colors, domain)
- Monetization: hosted MCP subscription, white-label license, usage-based API
