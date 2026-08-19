# mcp-mvp


A personal MCP server: notes + alerts as tools, backed by Postgres, with a
dashboard that logs every tool call. Built with Next.js App Router,
[`mcp-handler`](https://github.com/vercel/mcp-handler) v1, and Drizzle ORM.

## Stack


- **Next.js 15** (App Router) -- single deploy serves the MCP endpoint, the
  dashboard, and the key-management API.
- **`mcp-handler@1`** -- pinned to the 1.x line deliberately: 2.x dropped
  the HTTP+SSE transport, and as of this writing claude.ai's remote
  connector UI still speaks SSE, not just Streamable HTTP. `/api/mcp` and
  `/api/sse` are both served from `app/api/[transport]/route.ts`.
- **Postgres** via `drizzle-orm` + `postgres` (works with Neon, Supabase,
  or any Postgres instance).
- **API key auth** -- a single shared secret gates the dashboard; each MCP
  client gets its own bearer-token API key, generated from the dashboard.

## Setup

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL, DASHBOARD_PASSWORD, SESSION_SECRET, CRON_SECRET
npm run db:generate   # writes SQL migrations from lib/db/schema.ts
npm run db:migrate    # applies them to DATABASE_URL
npm run dev
```

Then open `http://localhost:3000/dashboard`, log in with
`DASHBOARD_PASSWORD`, and create an API key.

## Connecting a client

- **Claude Code / API**: point it at `http://localhost:3000/api/mcp`
  (Streamable HTTP), with the API key as a bearer token.
- **claude.ai remote connectors**: use `http://localhost:3000/api/sse`
  instead -- that's the transport its connector UI currently speaks.
- Test either with the [MCP inspector](https://modelcontextprotocol.io/docs/tools/inspector)
  before wiring up a real client.

## Tools exposed

| Tool | What it does |
|---|---|
| `create_note` / `list_notes` / `search_notes` / `delete_note` | Basic note CRUD |
| `create_alert` / `list_alerts` | Alert rules; see `lib/mcp/alerts.ts` for the condition DSL |
| `get_stats` | Call counts, top tools, active alerts -- same data as the dashboard |

Every call is logged to `mcp_calls` (tool name, args, status, latency) by
`lib/mcp/logging.ts`'s `withLogging` wrapper, which is what the dashboard
reads from.

## Alerts

`create_alert` takes a small JSON condition, e.g.:

```json
{ "type": "note_count_gte", "value": 10 }
```

A Vercel Cron job (`vercel.json`, every 15 minutes) hits
`/api/cron/evaluate-alerts`, which checks every active alert and POSTs to
its `webhookUrl` (if set) when the condition holds. Add new condition
types in `lib/mcp/alerts.ts`.

## What's deliberately out of scope for this MVP

- **Multi-user / OAuth.** Auth is a single dashboard password + per-client
  API keys -- fine solo, not fine once other people need their own
  logins. Swap in Clerk's MCP OAuth server or a hand-rolled OAuth 2.1
  flow (`/authorize`, `/token`, client registration) when you get there.
- **DCR-based OAuth client registration.** If you do add OAuth, note DCR
  is being deprecated in favor of clients self-describing via an HTTPS
  metadata URL -- don't build against DCR fresh.
- **Alert condition types beyond the two seeded here.** The DSL is
  intentionally minimal; extend `alertConditionSchema` and
  `evaluateCondition` in `lib/mcp/alerts.ts` as needed.

## Deploying

```bash
vercel deploy
```

Set `DATABASE_URL`, `DASHBOARD_PASSWORD`, `SESSION_SECRET`, and
`CRON_SECRET` as Vercel project env vars (the last one also has to match
what Vercel Cron sends -- Vercel sets this automatically when
`CRON_SECRET` is defined as a project env var). `DATABASE_URL` must be
set at build time too, since `lib/db/index.ts` creates its client at
module load.
