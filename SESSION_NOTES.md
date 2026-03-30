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
