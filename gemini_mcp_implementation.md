# Gemini Custom App MCP Implementation Details

This document outlines how the Model Context Protocol (MCP) server is implemented and specifically tailored to connect successfully with Gemini Custom Apps. 
Connecting to Gemini requires satisfying strict OAuth 2.0 and URL routing constraints. Since this server does not currently use real user accounts, we use a "Mock OAuth" flow that satisfies Gemini's requirements while keeping the deployment simple.

## 1. Clean URL Routing (`middleware.ts`)

Gemini is pointed to a clean App Link URL: `https://mcp-mvp.vercel.app/mcp`. 

Gemini supports two transports: **Streamable HTTP POST** and **SSE (Server-Sent Events)**. To seamlessly support this single `/mcp` endpoint without requiring users to configure specific `/api/sse` or `/api/mcp` paths, we use Next.js Middleware (`middleware.ts`) to route based on the HTTP method:
- **`GET /mcp`**: Rewritten to `/api/sse` (Used for initiating SSE connections).
- **`POST /mcp`**: Rewritten to `/api/mcp` (Used for Streamable HTTP or SSE messages).

## 2. Mock OAuth 2.0 Flow

Gemini Custom Apps **require** OAuth authentication. Because this is a single-tenant or lightweight deployment, we implement a static mock OAuth flow.

### OAuth Discovery
Gemini looks for `/.well-known/oauth-authorization-server` to discover the OAuth endpoints.
- **Endpoint**: `app/.well-known/oauth-authorization-server/route.ts`
- **Action**: Returns the dynamically resolved URLs for the authorization and token endpoints.

### Authorization Endpoint
- **Endpoint**: `app/oauth/authorize/route.ts`
- **Action**: When Gemini sends the user here, it immediately issues a `302 Found` redirect back to Gemini's `redirect_uri` with a hardcoded `mock_auth_code_12345` and the required `state` parameter. No user login screen is displayed.

### Token Exchange Endpoint
- **Endpoint**: `app/oauth/token/route.ts`
- **Action**: Exchanges the mock authorization code for a mock access token (`mcp_live_mock_token_9999`). 
- **Strict Compliance**: To satisfy strict OAuth clients, it returns `Cache-Control: no-store` and `Pragma: no-cache` headers, along with standard JSON fields (`access_token`, `token_type`, `expires_in`, `refresh_token`).

### Protected Resource Metadata
- **Endpoint**: `app/.well-known/oauth-protected-resource/route.ts`
- **Action**: Gemini checks this to ensure the server it is authenticating with matches the resource it wants to access. It explicitly declares the resource URL as `https://<domain>/mcp` to prevent resource-mismatch rejections.

## 3. Request Interception & Validation

When Gemini finally makes a request to `/mcp` (which the middleware routes to the `mcp-handler` library), it includes the `Authorization: Bearer mcp_live_mock_token_9999` header.

### Authentication Wrapper
- **Location**: `lib/auth.ts` -> `verifyApiKey`
- **Action**: Intercepts the request. If the token exactly matches `"mcp_live_mock_token_9999"`, it bypasses standard database API key validation and returns a mock Auth context with `clientId: "mock_client"`.

### MCP Request Handler
- **Location**: `app/api/[transport]/route.ts`
- **Action**: The `mcp-handler` library receives the authenticated request and executes the requested tools (e.g., creating notes, reading alerts) against the database.

## 4. Comprehensive Access Logging

To monitor connection attempts (especially failed pings from Gemini), all relevant API endpoints are wrapped in a global logger.

- **Table**: `access_logs` (schema defined in `lib/db/schema.ts`).
- **Wrapper**: `withAccessLogging` in `lib/logging.ts`.
- **Logged Data**: Method, path, HTTP status code, user agent, authorization header snippet, IP, and latency.
- **Dashboard**: The UI at `/dashboard` pulls the 25 most recent logs so the developer can actively monitor Gemini's pings and diagnose connection drops (like 401s or 405s) in real-time.
