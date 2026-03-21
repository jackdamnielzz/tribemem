#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { setApiKey } from './auth';
import {
  queryKnowledgeSchema,
  queryKnowledge,
  queryKnowledgeDescription,
} from './tools/query-knowledge';
import {
  getProcessSchema,
  getProcess,
  getProcessDescription,
} from './tools/get-process';
import {
  listDecisionsSchema,
  listDecisions,
  listDecisionsDescription,
} from './tools/list-decisions';
import {
  getContextSchema,
  getContext,
  getContextDescription,
} from './tools/get-context';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(args: string[]): { apiKey: string } {
  let apiKey: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--api-key' && i + 1 < args.length) {
      apiKey = args[i + 1];
      i++;
    } else if (args[i]?.startsWith('--api-key=')) {
      apiKey = args[i].split('=').slice(1).join('=');
    }
  }

  // Fall back to environment variable
  if (!apiKey) {
    apiKey = process.env.TRIBEMEM_API_KEY;
  }

  if (!apiKey) {
    console.error(
      'Error: API key is required.\n' +
        'Usage: tribemem-mcp --api-key <your-api-key>\n' +
        'Or set the TRIBEMEM_API_KEY environment variable.',
    );
    process.exit(1);
  }

  return { apiKey };
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { apiKey } = parseArgs(process.argv.slice(2));
  setApiKey(apiKey);

  const server = new McpServer({
    name: 'tribemem',
    version: '0.1.0',
  });

  // Register tools
  server.tool(
    'query_knowledge',
    queryKnowledgeDescription,
    queryKnowledgeSchema.shape,
    async (input) => {
      try {
        const content = await queryKnowledge(input);
        return { content: [{ type: 'text' as const, text: content }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error querying knowledge: ${message}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'get_process',
    getProcessDescription,
    getProcessSchema.shape,
    async (input) => {
      try {
        const content = await getProcess(input);
        return { content: [{ type: 'text' as const, text: content }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error getting process: ${message}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'list_recent_decisions',
    listDecisionsDescription,
    listDecisionsSchema.shape,
    async (input) => {
      try {
        const content = await listDecisions(input);
        return { content: [{ type: 'text' as const, text: content }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error listing decisions: ${message}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'get_context',
    getContextDescription,
    getContextSchema.shape,
    async (input) => {
      try {
        const content = await getContext(input);
        return { content: [{ type: 'text' as const, text: content }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error getting context: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // Start the stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error starting TribeMem MCP server:', error);
  process.exit(1);
});
