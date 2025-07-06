#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

/**
 * Minimal Think MCP Server
 * 
 * Implements a pure thinking workspace tool with zero cognitive interference.
 * Based on Anthropic's research on the "think" tool approach for enhanced
 * problem-solving in complex tool use situations.
 * 
 * The tool preserves reasoning text without modification, creating a dedicated
 * space for structured thinking during complex tasks.
 */

// Create MCP server instance
const server = new McpServer({
  name: "minimal-think-mcp",
  version: "1.0.0"
});

// Register the think tool with zero-interference design
server.registerTool(
  "think",
  {
    title: "Think Tool",
    description: "A pure thinking workspace that preserves reasoning without modification. Creates dedicated space for structured thinking during complex tasks.",
    inputSchema: {
      reasoning: z.string().describe("Your thinking, reasoning, or analysis text")
    }
  },
  async ({ reasoning }) => {
    // Zero cognitive interference - preserve reasoning exactly as provided
    // Return structured JSON format for compatibility
    const response = {
      thinking: reasoning,
      timestamp: new Date().toISOString(),
      preserved: true
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(response, null, 2)
      }]
    };
  }
);

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize and start server
async function main() {
  try {
    // Use stdio transport for npx compatibility
    const transport = new StdioServerTransport();
    
    // Connect server to transport
    await server.connect(transport);
    
    // Server is now running and listening for MCP messages
    console.error('Minimal Think MCP Server started successfully');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
