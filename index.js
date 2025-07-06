#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Minimal Think MCP Server with Persistent Sessions
 * 
 * Implements a pure thinking workspace tool with zero cognitive interference.
 * Based on Anthropic's research on the "think" tool approach for enhanced
 * problem-solving in complex tool use situations.
 * 
 * The tool preserves reasoning text without modification, creating a dedicated
 * space for structured thinking during complex tasks.
 * 
 * Enhanced with persistent session storage to maintain thinking context
 * across device restarts and long periods of time.
 */

// Session storage directory - allow override via environment variable for testing
const SESSION_DIR = process.env.SESSION_DIR || path.join(os.homedir(), '.minimal-think-sessions');

// Ensure session directory exists
async function ensureSessionDir() {
  try {
    await fs.mkdir(SESSION_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create session directory:', error);
  }
}

// Load a session from disk
async function loadSession(sessionId) {
  try {
    const sessionPath = path.join(SESSION_DIR, `${sessionId}.json`);
    const data = await fs.readFile(sessionPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return empty array if session doesn't exist yet
    return [];
  }
}

// Save a session to disk
async function saveSession(sessionId, thoughts) {
  try {
    const sessionPath = path.join(SESSION_DIR, `${sessionId}.json`);
    await fs.writeFile(sessionPath, JSON.stringify(thoughts, null, 2), 'utf8');
  } catch (error) {
    console.error(`Failed to save session ${sessionId}:`, error);
  }
}

// Get the default session ID
async function getDefaultSession() {
  try {
    const defaultSessionPath = path.join(SESSION_DIR, 'defaultSession.json');
    const data = await fs.readFile(defaultSessionPath, 'utf8');
    const { defaultSessionId } = JSON.parse(data);
    return defaultSessionId;
  } catch (error) {
    // No default session yet
    return null;
  }
}

// Set the default session ID
async function setDefaultSession(sessionId) {
  try {
    const defaultSessionPath = path.join(SESSION_DIR, 'defaultSession.json');
    await fs.writeFile(defaultSessionPath, JSON.stringify({ defaultSessionId: sessionId }), 'utf8');
  } catch (error) {
    console.error(`Failed to set default session ${sessionId}:`, error);
  }
}

// Manual cleanup utility for old sessions
async function cleanupOldSessions(maxAgeDays = 90) {
  try {
    await ensureSessionDir();
    const files = await fs.readdir(SESSION_DIR);
    const now = new Date();
    let deletedCount = 0;
    
    for (const file of files) {
      if (!file.endsWith('.json') || file === 'defaultSession.json') continue;
      
      const filePath = path.join(SESSION_DIR, file);
      const stats = await fs.stat(filePath);
      const fileAge = (now - stats.mtime) / (1000 * 60 * 60 * 24); // age in days
      
      if (fileAge > maxAgeDays) {
        await fs.unlink(filePath);
        console.error(`Deleted old session: ${file} (${fileAge.toFixed(1)} days old)`);
        deletedCount++;
      }
    }
    
    return { deletedCount, maxAgeDays };
  } catch (error) {
    console.error('Session cleanup failed:', error);
    throw error;
  }
}

// Create MCP server instance
const server = new McpServer({
  name: "minimal-think-mcp",
  version: "1.2.0"
});

// Register the enhanced think tool with persistent sessions
server.registerTool(
  "think",
  {
    title: "Think Tool",
    description: "A persistent thinking workspace that preserves reasoning across sessions. Creates dedicated space for structured thinking during complex tasks.",
    inputSchema: {
      reasoning: z.string().describe("Your thinking, reasoning, or analysis text"),
      sessionId: z.string().optional().describe("Session ID to continue an existing thinking process"),
      useDefaultSession: z.boolean().optional().default(false).describe("Use the default session automatically"),
      setAsDefault: z.boolean().optional().default(false).describe("Set this session as the default for future thinking"),
      mode: z.enum(["linear", "creative", "critical", "strategic", "empathetic"]).optional()
        .describe("Optional thinking mode to structure your reasoning"),
      tags: z.array(z.string()).optional().describe("Optional tags for categorizing thoughts"),
      newChat: z.boolean().optional().default(false).describe("Force a new session even if sessionId is provided")
    }
  },
  async ({ reasoning, sessionId, useDefaultSession, setAsDefault, mode, tags, newChat }) => {
    // Ensure session directory exists
    await ensureSessionDir();
    
    // Determine session ID logic:
    // 1. If newChat is true, always create a new session
    // 2. If sessionId is provided and newChat is false, use that (highest priority)
    // 3. If useDefaultSession is true, try to get default session
    // 4. If no default session or useDefaultSession is false, create new session
    let session = newChat ? null : sessionId;
    let usedDefaultSession = false;
    let isNewSession = false;
    
    if (!session && useDefaultSession) {
      session = await getDefaultSession();
      usedDefaultSession = !!session;
    }
    
    // If we still don't have a session ID, generate a new one
    if (!session) {
      session = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      isNewSession = true;
    }
    
    // Load existing thoughts for this session
    const thoughts = await loadSession(session);
    
    // Add new thought
    const thoughtId = thoughts.length + 1;
    thoughts.push({
      id: thoughtId,
      content: reasoning,
      mode: mode || "linear",
      tags: tags || [],
      timestamp: new Date().toISOString()
    });
    
    // Save updated session
    await saveSession(session, thoughts);
    
    // Set as default if requested
    if (setAsDefault) {
      await setDefaultSession(session);
    }
    
    // Generate the response JSON
    const responseJson = {
      thinking: reasoning,
      thoughtId: thoughtId,
      sessionId: session,
      mode: mode || "linear",
      tags: tags || [],
      timestamp: new Date().toISOString(),
      thoughtCount: thoughts.length,
      preserved: true,
      usingDefaultSession: usedDefaultSession,
      isDefaultSession: setAsDefault || usedDefaultSession,
      isNewSession: isNewSession
    };
    
    // Create a note for Claude about session continuity
    const claudeNote = `
<!-- 
Session ID: ${session}
In this chat, I should automatically include this session ID in future "think" tool calls 
unless instructed to start a new session or use a different session.

For future think tool calls in this chat, I'll use:
{
  "reasoning": "...",
  "sessionId": "${session}"
}
-->`;
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(responseJson, null, 2) + claudeNote
      }]
    };
  }
);

// List available sessions
server.registerTool(
  "list_sessions",
  {
    title: "List Sessions",
    description: "List all available thinking sessions",
    inputSchema: {}
  },
  async () => {
    try {
      await ensureSessionDir();
      const files = await fs.readdir(SESSION_DIR);
      
      // Get default session
      let defaultSessionId = null;
      try {
        defaultSessionId = await getDefaultSession();
      } catch (error) {
        // No default session
      }
      
      const sessionInfo = await Promise.all(files
        .filter(file => file.endsWith('.json') && file !== 'defaultSession.json')
        .map(async file => {
          const sessionId = file.replace('.json', '');
          const filePath = path.join(SESSION_DIR, file);
          const stats = await fs.stat(filePath);
          
          try {
            const thoughts = await loadSession(sessionId);
            return {
              sessionId,
              thoughtCount: thoughts.length,
              firstThought: thoughts[0]?.timestamp || null,
              lastThought: thoughts[thoughts.length - 1]?.timestamp || null,
              lastModified: stats.mtime.toISOString(),
              isDefault: sessionId === defaultSessionId
            };
          } catch (e) {
            return {
              sessionId,
              error: "Could not read session data",
              lastModified: stats.mtime.toISOString(),
              isDefault: sessionId === defaultSessionId
            };
          }
        }));
      
      const responseJson = {
        sessions: sessionInfo,
        count: sessionInfo.length,
        defaultSessionId,
        timestamp: new Date().toISOString()
      };
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(responseJson, null, 2)
        }]
      };
    } catch (error) {
      console.error('Failed to list sessions:', error);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: "Failed to list sessions",
            message: error.message
          }, null, 2)
        }]
      };
    }
  }
);

// View a specific session
server.registerTool(
  "view_session",
  {
    title: "View Session",
    description: "View the complete contents of a thinking session",
    inputSchema: {
      sessionId: z.string().optional().describe("Session ID to view. If not provided, the default session will be used if available.")
    }
  },
  async ({ sessionId }) => {
    try {
      // If no sessionId provided, try to use default session
      let session = sessionId;
      let usedDefaultSession = false;
      
      if (!session) {
        session = await getDefaultSession();
        usedDefaultSession = !!session;
        
        if (!session) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "No session ID provided and no default session set",
                message: "Please provide a session ID or set a default session first"
              }, null, 2)
            }]
          };
        }
      }
      
      const thoughts = await loadSession(session);
      
      const responseJson = {
        sessionId: session,
        thoughts,
        count: thoughts.length,
        timestamp: new Date().toISOString(),
        usingDefaultSession: usedDefaultSession
      };
      
      // Create a note for Claude about session continuity
      const claudeNote = `
<!-- 
Session ID: ${session}
I now know about this session and should use it if the user wants to continue this thinking process.
-->`;
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(responseJson, null, 2) + claudeNote
        }]
      };
    } catch (error) {
      console.error(`Failed to view session ${sessionId}:`, error);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: "Failed to view session",
            message: error.message
          }, null, 2)
        }]
      };
    }
  }
);

// Delete a session
server.registerTool(
  "delete_session",
  {
    title: "Delete Session",
    description: "Delete a thinking session",
    inputSchema: {
      sessionId: z.string().describe("Session ID to delete")
    }
  },
  async ({ sessionId }) => {
    try {
      const sessionPath = path.join(SESSION_DIR, `${sessionId}.json`);
      await fs.unlink(sessionPath);
      
      // If this was the default session, clear that too
      const defaultSessionId = await getDefaultSession();
      if (defaultSessionId === sessionId) {
        const defaultSessionPath = path.join(SESSION_DIR, 'defaultSession.json');
        try {
          await fs.unlink(defaultSessionPath);
        } catch (error) {
          // Ignore if file doesn't exist
        }
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "success",
            message: `Session ${sessionId} deleted successfully`,
            wasDefault: defaultSessionId === sessionId,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error(`Failed to delete session ${sessionId}:`, error);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: "Failed to delete session",
            message: error.message
          }, null, 2)
        }]
      };
    }
  }
);

// Set or reset default session
server.registerTool(
  "set_default_session",
  {
    title: "Set Default Session",
    description: "Set or reset the default thinking session",
    inputSchema: {
      sessionId: z.string().optional().describe("Session ID to set as default. If not provided, the default session will be cleared.")
    }
  },
  async ({ sessionId }) => {
    try {
      if (sessionId) {
        // Verify the session exists before setting it as default
        const sessionPath = path.join(SESSION_DIR, `${sessionId}.json`);
        try {
          await fs.access(sessionPath);
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Invalid session ID",
                message: `Session ${sessionId} does not exist`
              }, null, 2)
            }]
          };
        }
        
        // Set new default session
        await setDefaultSession(sessionId);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "success",
              message: `Default session set to ${sessionId}`,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      } else {
        // Clear default session
        const defaultSessionPath = path.join(SESSION_DIR, 'defaultSession.json');
        try {
          await fs.unlink(defaultSessionPath);
        } catch (error) {
          // Ignore if file doesn't exist
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "success",
              message: "Default session cleared",
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
    } catch (error) {
      console.error(`Failed to set default session:`, error);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: "Failed to set default session",
            message: error.message
          }, null, 2)
        }]
      };
    }
  }
);

// Manual cleanup of old sessions
server.registerTool(
  "cleanup_sessions",
  {
    title: "Cleanup Old Sessions",
    description: "Manually clean up old thinking sessions",
    inputSchema: {
      maxAgeDays: z.number().min(1).default(90).describe("Maximum age in days before sessions are deleted")
    }
  },
  async ({ maxAgeDays }) => {
    try {
      const result = await cleanupOldSessions(maxAgeDays);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "success",
            deletedCount: result.deletedCount,
            maxAgeDays: result.maxAgeDays,
            message: `Deleted ${result.deletedCount} sessions older than ${result.maxAgeDays} days`,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('Failed to clean up sessions:', error);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: "Failed to clean up sessions",
            message: error.message
          }, null, 2)
        }]
      };
    }
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
    // Ensure session directory exists on startup
    await ensureSessionDir();
    
    // Use stdio transport for npx compatibility
    const transport = new StdioServerTransport();
    
    // Connect server to transport
    await server.connect(transport);
    
    // Server is now running and listening for MCP messages
    console.error('Minimal Think MCP Server with persistent sessions started successfully');
    console.error(`Session storage: ${SESSION_DIR}`);
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
