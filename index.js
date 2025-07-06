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
 * Enhanced with:
 * - Persistent session storage to maintain thinking context across device restarts
 * - Smart Context Injection for builds_on relationships (automatically surfaces
 *   reasoning chains, conflicting thoughts, and supporting evidence)
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
  version: "1.2.4"
});

// Register the enhanced think tool with persistent sessions and relationship tracking
server.registerTool(
  "think",
  {
    title: "Think Tool",
    description: "A persistent thinking workspace that preserves reasoning across sessions. Creates dedicated space for structured thinking during complex tasks with relationship tracking.",
    inputSchema: {
      reasoning: z.string().describe("Your thinking, reasoning, or analysis text"),
      sessionId: z.string().optional().describe("Session ID to continue an existing thinking process"),
      useDefaultSession: z.boolean().optional().default(false).describe("Use the default session automatically"),
      setAsDefault: z.boolean().optional().default(false).describe("Set this session as the default for future thinking"),
      mode: z.enum(["linear", "creative", "critical", "strategic", "empathetic"]).optional()
        .describe("Optional thinking mode to structure your reasoning"),
      tags: z.array(z.string()).optional().describe("Optional tags for categorizing thoughts"),
      newChat: z.boolean().optional().default(false).describe("Force a new session even if sessionId is provided"),
      relates_to: z.string().optional().describe("ID of thought this relates to"),
      relationship_type: z.enum(["builds_on", "supports", "contradicts", "refines", "synthesizes"]).optional().describe("Type of relationship to the referenced thought")
    }
  },
  async ({ reasoning, sessionId, useDefaultSession, setAsDefault, mode, tags, newChat, relates_to, relationship_type }) => {
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
    const thoughtId = `thought_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const thoughtObj = {
      id: thoughtId,
      content: reasoning,
      mode: mode || "linear",
      tags: tags || [],
      timestamp: new Date().toISOString(),
      relates_to: null,
      relationship_type: null,
      relationships_in: [], // thoughts that reference this thought
      relationships_out: []  // thoughts this thought references
    };

    // Validate and add relationship tracking
    if (relates_to && relationship_type) {
      // Prevent self-reference
      if (relates_to === thoughtId) {
        return { content: [{ type: "text", text: JSON.stringify({ error: "Cannot reference self" }) }] };
      }
      
      const referencedThought = thoughts.find(t => t.id === relates_to);
      if (!referencedThought) {
        return { content: [{ type: "text", text: JSON.stringify({ error: "Referenced thought not found", thought_id: relates_to }) }] };
      }
      
      // Refined temporal check - compare to current thought's timestamp
      if (new Date(referencedThought.timestamp) > new Date(thoughtObj.timestamp)) {
        return { content: [{ type: "text", text: JSON.stringify({ error: "Cannot reference future thoughts" }) }] };
      }
      
      // Now use the same referencedThought for relationship tracking
      referencedThought.relationships_in.push({ thought_id: thoughtId, relationship_type });
      thoughtObj.relationships_out.push({ thought_id: relates_to, relationship_type });
      thoughtObj.relates_to = relates_to;
      thoughtObj.relationship_type = relationship_type;
    }

    thoughts.push(thoughtObj);
    
    // Save updated session
    await saveSession(session, thoughts);
    
    // Set as default if requested
    if (setAsDefault) {
      await setDefaultSession(session);
    }
    
    // Add related thought context for AI
    let related_context = null;
    let reasoning_chain = null;
    
    if (relates_to && relationship_type) {
      const related_thought = thoughts.find(t => t.id === relates_to);
      if (related_thought) {
        related_context = {
          relationship: relationship_type,
          related_thought_id: relates_to,
          related_content: related_thought.content.substring(0, 200) + "...",
          related_mode: related_thought.mode
        };
        
        // context injection for builds_on relationships
        if (relationship_type === 'builds_on') {
            const chain = buildReasoningChain(relates_to, thoughts);
            
            // Find conflicting thoughts (max 3)
            const conflicts = thoughts.filter(t => 
                t.relationships_out.some(rel => 
                    rel.thought_id === relates_to && rel.relationship_type === 'contradicts'
                )
            ).slice(0, 3);
            
            // Find supporting evidence (max 3)
            const supports = thoughts.filter(t => 
                t.relationships_out.some(rel => 
                    rel.thought_id === relates_to && rel.relationship_type === 'supports'
                )
            ).slice(0, 3);
            
            // Build enhanced context object
            related_context = {
                type: 'builds_on_enhanced',
                chain_preview: chain.chain.slice(0, 5).map(t => t.content_preview),
                conflicts: conflicts.map(t => t.content.substring(0, 80) + "..."),
                supports: supports.map(t => t.content.substring(0, 80) + "...")
            };
            reasoning_chain = chain; // maintain backward compatibility
        }
      }
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
      related_context: related_context,
      reasoning_chain: reasoning_chain,
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

// Find thought relationships tool - helps AI discover related thoughts efficiently
server.registerTool(
  "find_thought_relationships",
  {
    title: "Find Thought Relationships",
    description: "Search for thoughts that could be related to current reasoning, helping AI build coherent argument chains",
    inputSchema: {
      query: z.string().describe("Search query to find related thoughts (searches content, tags, and modes)"),
      sessionId: z.string().optional().describe("Session ID to search in. If not provided, the default session will be used if available."),
      relationship_types: z.array(z.enum(["builds_on", "supports", "contradicts", "refines", "synthesizes"])).optional().describe("Filter by specific relationship types"),
      exclude_thought_id: z.string().optional().describe("Exclude a specific thought ID from results (useful to avoid self-reference)"),
      limit: z.number().min(1).max(20).default(10).describe("Maximum number of results to return")
    }
  },
  async ({ query, sessionId, relationship_types, exclude_thought_id, limit }) => {
    try {
      await ensureSessionDir();
      
      // Determine session to use
      let session = sessionId;
      if (!session) {
        session = await getDefaultSession();
        if (!session) {
          return { content: [{ type: "text", text: JSON.stringify({ error: "No session ID provided and no default session set" }) }] };
        }
      }
      
      const thoughts = await loadSession(session);
      
      if (thoughts.length === 0) {
        return { content: [{ type: "text", text: JSON.stringify({ results: [], total: 0, query: query }) }] };
      }
      
      // Search logic
      const queryLower = query.toLowerCase();
      const searchResults = thoughts
        .filter(t => {
          // Exclude specific thought if requested
          if (exclude_thought_id && t.id === exclude_thought_id) return false;
          
          // Filter by relationship types if specified
          if (relationship_types && relationship_types.length > 0) {
            if (!t.relationship_type || !relationship_types.includes(t.relationship_type)) return false;
          }
          
          // Search in content, tags, and mode
          const contentMatch = t.content.toLowerCase().includes(queryLower);
          const tagMatch = t.tags && t.tags.some(tag => tag.toLowerCase().includes(queryLower));
          const modeMatch = t.mode && t.mode.toLowerCase().includes(queryLower);
          
          return contentMatch || tagMatch || modeMatch;
        })
        .map(t => ({
          id: t.id,
          content_preview: t.content.substring(0, 150) + (t.content.length > 150 ? "..." : ""),
          mode: t.mode,
          tags: t.tags,
          timestamp: t.timestamp,
          relates_to: t.relates_to,
          relationship_type: t.relationship_type,
          // Calculate relevance score (simple scoring)
          relevance_score: calculateRelevanceScore(t, queryLower)
        }))
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, limit);
      
      const response = {
        results: searchResults,
        total: searchResults.length,
        query: query,
        sessionId: session,
        searched_thoughts: thoughts.length
      };
      
      return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
      
    } catch (error) {
      console.error('Failed to find thought relationships:', error);
      return { content: [{ type: "text", text: JSON.stringify({ error: "Failed to find relationships", message: error.message }) }] };
    }
  }
);

// Simple relevance scoring function
function calculateRelevanceScore(thought, queryLower) {
  let score = 0;
  const content = thought.content.toLowerCase();
  
  // Exact phrase match gets highest score
  if (content.includes(queryLower)) {
    score += 10;
  }
  
  // Word matches
  const queryWords = queryLower.split(/\s+/);
  queryWords.forEach(word => {
    if (content.includes(word)) {
      score += 2;
    }
  });
  
  // Tag matches
  if (thought.tags) {
    thought.tags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        score += 5;
      }
    });
  }
  
  // Mode match
  if (thought.mode && thought.mode.toLowerCase().includes(queryLower)) {
    score += 3;
  }
  
  // Boost score for thoughts with relationships (they're part of reasoning chains)
  if (thought.relates_to || thought.relationship_type) {
    score += 1;
  }
  
  return score;
}

// Build reasoning chain for "builds_on" relationships
// Traces back the chain of thoughts that build on each other
// Returns: [foundation_thought] → [building_thought] → [current_thought]
function buildReasoningChain(thoughtId, thoughts) {
  const chain = [];
  const visited = new Set(); // Prevent infinite loops
  let currentId = thoughtId;
  
  // Trace backwards through the builds_on chain
  while (currentId && !visited.has(currentId) && chain.length < 20) {
    visited.add(currentId);
    const thought = thoughts.find(t => t.id === currentId);
    
    if (!thought) break;
    
    // Add to front of chain (we're going backwards)
    chain.unshift({
      id: thought.id,
      content_preview: thought.content.substring(0, 120) + (thought.content.length > 120 ? "..." : ""),
      mode: thought.mode,
      timestamp: thought.timestamp,
      relationship_type: thought.relationship_type
    });
    
    // Continue tracing if this thought builds on another
    if (thought.relationship_type === 'builds_on' && thought.relates_to) {
      currentId = thought.relates_to;
    } else {
      break;
    }
  }
  
  // Limit chain length to respect working memory constraints (7±2 items)
  const maxChainLength = 7;
  if (chain.length > maxChainLength) {
    // Keep the most recent items and add an indicator for truncation
    const truncatedChain = chain.slice(-maxChainLength);
    truncatedChain[0] = {
      ...truncatedChain[0],
      truncated: true,
      note: `... (${chain.length - maxChainLength} earlier thoughts in chain)`
    };
    return {
      chain: truncatedChain,
      total_length: chain.length,
      truncated: true
    };
  }
  
  return {
    chain: chain,
    total_length: chain.length,
    truncated: false
  };
}

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
