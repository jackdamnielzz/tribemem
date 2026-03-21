# MCP Server Setup Guide

TribeMem provides an MCP (Model Context Protocol) server that exposes your organization's knowledge to AI tools. This allows Claude Desktop, Claude Code, Cursor, and other MCP-compatible tools to query TribeMem as part of their context.

---

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io) is an open standard that lets AI applications connect to external data sources and tools. When you run the TribeMem MCP server, your AI assistant can:

- Answer questions using your organization's knowledge base.
- Look up how specific processes work.
- Find recent decisions and the reasoning behind them.
- Understand relationships between people, teams, and systems.

The MCP server runs locally on your machine and communicates with the TribeMem API using your API key.

---

## Prerequisites

- An active TribeMem account with API access (Starter plan or higher).
- An API key with `query:read` and `knowledge:read` scopes.
- Node.js >= 20.

---

## Installation

The MCP server is distributed as an npm package. You do not need to install it globally -- the AI tools will run it via `npx`.

To test it manually:

```bash
npx @tribemem/mcp-server --api-key tm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

The server starts and listens for MCP connections over stdio.

---

## Configuration

### Claude Desktop

Edit your Claude Desktop configuration file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the TribeMem server:

```json
{
  "mcpServers": {
    "tribemem": {
      "command": "npx",
      "args": [
        "@tribemem/mcp-server",
        "--api-key",
        "tm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      ]
    }
  }
}
```

Restart Claude Desktop. You should see "tribemem" listed in the available MCP tools.

### Claude Code

Add the MCP server to your Claude Code configuration:

```bash
claude mcp add tribemem -- npx @tribemem/mcp-server --api-key tm_live_xxx
```

Or add it to your project's `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "tribemem": {
      "command": "npx",
      "args": [
        "@tribemem/mcp-server",
        "--api-key",
        "tm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      ]
    }
  }
}
```

### Cursor

In Cursor, go to **Settings > MCP Servers** and add a new server:

- **Name:** `tribemem`
- **Command:** `npx`
- **Arguments:** `@tribemem/mcp-server --api-key tm_live_xxx`

Alternatively, add it to your project's `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "tribemem": {
      "command": "npx",
      "args": [
        "@tribemem/mcp-server",
        "--api-key",
        "tm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      ]
    }
  }
}
```

---

## Environment Variable Alternative

Instead of passing the API key as a command-line argument, you can use an environment variable:

```json
{
  "mcpServers": {
    "tribemem": {
      "command": "npx",
      "args": ["@tribemem/mcp-server"],
      "env": {
        "TRIBEMEM_API_KEY": "tm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

---

## Available Tools

The MCP server exposes the following tools to the AI assistant:

### `query_knowledge`

Ask a natural-language question against your organization's knowledge base.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | The question to ask |
| `categories` | string[] | No | Filter by category (engineering, product, etc.) |
| `types` | string[] | No | Filter by type (fact, process, decision, norm) |
| `min_confidence` | number | No | Minimum confidence score (0-1) |

**Example usage in a conversation:**

> "Use tribemem to find out what our deployment process looks like."

The AI assistant will call `query_knowledge` with `query: "deployment process"` and return the answer with sources.

### `get_process`

Retrieve a specific documented process by name or keyword.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Process name or keyword |

**Example:**

> "What is the onboarding process for new engineers? Check tribemem."

### `list_recent_decisions`

List recent decisions made by the organization.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Number of decisions to return (default 10) |
| `category` | string | No | Filter by category |
| `days` | number | No | Only include decisions from the last N days |

**Example:**

> "Show me the engineering decisions from the last 2 weeks."

### `get_context`

Retrieve contextual information about an entity (person, team, system, project).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entity` | string | Yes | Entity name to look up |
| `include_relations` | boolean | No | Include related entities (default true) |

**Example:**

> "Tell me about the Payment Service -- what teams own it and what it depends on."

---

## Example Conversations

### Finding a process

**You:** How do we handle production incidents? Check our knowledge base.

**Assistant:** *(calls `query_knowledge` with query "production incident process")*

Based on your organization's knowledge base, your production incident process works as follows:

1. The on-call engineer is paged via PagerDuty.
2. They open an incident channel in Slack using `/incident`.
3. The incident is triaged as P1-P4.
4. For P1/P2, a war room is started and the engineering manager is notified.
5. After resolution, a post-mortem is written within 48 hours.

*Source: "Production Incident Process" (confidence: 0.94, last confirmed: March 15, 2026)*

### Understanding a system

**You:** What do you know about our Authentication Service?

**Assistant:** *(calls `get_context` with entity "Authentication Service")*

The Authentication Service is owned by the Platform Team. It depends on PostgreSQL and Redis, and is used by the Web App, Mobile App, and Public API. It was recently migrated from JWT to session-based auth (decision made January 2026).

---

## Troubleshooting

### "Server not found" in Claude Desktop

- Ensure Node.js >= 20 is installed and `npx` is on your PATH.
- Restart Claude Desktop after editing the configuration file.
- Check that the JSON syntax in the config file is valid.

### "Unauthorized" errors

- Verify your API key starts with `tm_live_`.
- Check that the key has `query:read` and `knowledge:read` scopes.
- Ensure the key has not been revoked in the TribeMem dashboard.

### Slow responses

- The first call may take a few seconds while `npx` downloads the package.
- Subsequent calls should respond within 1-3 seconds depending on your plan's rate limits and network latency.
