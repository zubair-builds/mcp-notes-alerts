# MCP Notes & Alerts

Personal [Model Context Protocol](https://modelcontextprotocol.io/) server: notes and alerts as tools, Postgres behind them, a dashboard that logs every call.

Suggested repo name: `mcp-notes-alerts`.

One Next.js deploy serves `/api/mcp` (Streamable HTTP), `/api/sse` (Claude.ai remote connector), `/dashboard`, and a mock OAuth path so Gemini Custom Apps can connect.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 15 App Router |
| MCP | `mcp-handler` 1.x + `@modelcontextprotocol/sdk` |
| Data | Postgres, Drizzle ORM |
| Auth | Dashboard password + per-client API keys; mock OAuth for Gemini |
| Cron | Vercel Cron → `/api/cron/evaluate-alerts` |

## Setup

```bash
git clone https://github.com/zubair-builds/mcp-mvp.git
cd mcp-mvp
npm install
cp .env.example .env
# DATABASE_URL, DASHBOARD_PASSWORD, SESSION_SECRET, CRON_SECRET
npm run db:generate
npm run db:migrate
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard), sign in, create an API key.

- Claude Code / API: `http://localhost:3000/api/mcp` with Bearer token
- claude.ai remote: `http://localhost:3000/api/sse`
- Gemini Custom Apps: app URL `/mcp` (middleware routes GET→SSE, POST→HTTP). Details in `gemini_mcp_implementation.md`

## Tools

| Tool | Role |
| --- | --- |
| `create_note` / `list_notes` / `search_notes` / `delete_note` | Notes |
| `create_alert` / `list_alerts` | Rules + optional webhook |
| `get_stats` | Call counts for the dashboard |

Alert example: `{ "type": "note_count_gte", "value": 10 }`.

## Out of scope

- Real multi-user OAuth (the Gemini path auto-approves)
- Rich alert DSL — extend `lib/mcp/alerts.ts`

Do not commit `.env`. Rotate `DASHBOARD_PASSWORD` / `SESSION_SECRET` / `CRON_SECRET` before any public deploy.

## Author

[Syed Zubair Haider](https://github.com/zubair-builds) · [LinkedIn](https://www.linkedin.com/in/syed-zubair-haider/)
