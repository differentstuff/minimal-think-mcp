# Minimal Think MCP

A high-performance JavaScript native MCP server implementing a minimal "think" tool with zero cognitive interference and persistent sessions. Based on [Anthropic's research](https://www.anthropic.com/engineering/claude-think-tool) on enhancing Claude's complex problem-solving abilities through dedicated thinking workspaces.

## Overview

This MCP server provides a persistent thinking workspace that preserves reasoning text without modification, creating dedicated space for structured thinking during complex tasks. The tool follows the zero-interference principle - it simply preserves and structures your reasoning without any cognitive overhead.

## Features

- **Zero Cognitive Interference**: Pure thinking workspace approach
- **Persistent Sessions**: Thoughts are preserved even between device shutdowns
- **Default Session Support**: Optionally continue the same session across multiple chats
- **Thinking Modes**: Optional support for different thinking strategies
- **Session Management**: List, view, and manage thinking sessions
- **Long-Term Storage**: Maintains thinking context indefinitely by default
- **Native MCP Protocol**: Built with `@modelcontextprotocol/sdk` for optimal performance  
- **Instant Deployment**: Ready for `npx` deployment without installation
- **Claude Desktop Compatible**: Works seamlessly with Claude Desktop configuration
- **Minimal Dependencies**: Only the MCP SDK and Node.js standard libraries
- **Structured Output**: Returns reasoning as clean JSON for tool chaining

## Quick Start

### Option 1: NPX (Recommended)

No installation required. Simply add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "minimal-think": {
      "command": "npx",
      "args": ["-y", "minimal-think-mcp@latest"]
    }
  }
}
```

### Option 2: Global Installation

```bash
npm install -g minimal-think-mcp
```

Then configure Claude Desktop:

```json
{
  "mcpServers": {
    "minimal-think": {
      "command": "minimal-think-mcp"
    }
  }
}
```

## Claude Desktop Configuration

Add this to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "minimal-think": {
      "command": "npx", 
      "args": ["-y", "minimal-think-mcp@latest"]
    }
  }
}
```

## How It Works

The enhanced think tool accepts reasoning text and returns it as structured JSON with session context:

### Basic Usage in Claude

When you want Claude to use the thinking tool, you need to instruct Claude to use it with specific parameters:

```
Claude, please use the "think" tool to analyze this problem step by step.
```

Claude will then invoke the tool with something like:

```json
{
  "reasoning": "I need to analyze this complex problem step by step:
1. First, I'll identify the core constraints
2. Then I'll evaluate potential approaches  
3. Finally, I'll synthesize the optimal solution"
}
```

The tool's response (which Claude will show you):

```json
{
  "thinking": "I need to analyze this complex problem step by step:\n1. First, I'll identify the core constraints\n2. Then I'll evaluate potential approaches\n3. Finally, I'll synthesize the optimal solution",
  "thoughtId": 1,
  "sessionId": "session_1720529347123_ab7c9",
  "mode": "linear",
  "tags": [],
  "timestamp": "2025-07-06T10:30:00.000Z",
  "thoughtCount": 1,
  "preserved": true,
  "usingDefaultSession": false,
  "isDefaultSession": false
}
```

### Continuing a Session with the Same ID

To continue the session, you need to instruct Claude to use the same session ID:

```
Claude, please continue my thinking in session "session_1720529347123_ab7c9" about the next steps.
```

Claude will then invoke the tool with:

```json
{
  "reasoning": "Now that I've identified the constraints, let me evaluate three potential approaches...",
  "sessionId": "session_1720529347123_ab7c9",
  "mode": "creative",
  "tags": ["problem-solving", "evaluation"]
}
```

### Using Default Sessions Across Chats

#### Setting a Default Session

To set a default session that persists across chats, instruct Claude:

```
Claude, please set this thinking session as the default for future use.
```

Claude will invoke the tool with:

```json
{
  "reasoning": "Starting a long-term research project on quantum computing...",
  "setAsDefault": true
}
```

#### Using the Default Session in a New Chat

In a new chat with Claude, you can continue from the default session:

```
Claude, please continue my previous thinking using the default session.
```

Claude will then invoke the tool with:

```json
{
  "reasoning": "Continuing my quantum computing research from yesterday...",
  "useDefaultSession": true
}
```

**Important**: When using Claude with MCP tools, you must explicitly tell Claude what parameters to use. The parameters aren't set in a configuration file but are passed in your instructions to Claude each time you want to use the tool.

## Available Tools and How to Use Them

### think
The main thinking tool with persistent sessions.

**Parameters you can ask Claude to use:**
- `reasoning`: Your thinking text (required)
- `sessionId`: Session ID to continue an existing thinking process
- `useDefaultSession`: Set to true to use the default session automatically
- `setAsDefault`: Set to true to mark this session as the default for future thinking
- `mode`: Thinking mode (linear, creative, critical, strategic, empathetic)
- `tags`: Array of tags for categorizing thoughts

**Example instruction to Claude:**
```
Claude, please use the think tool with these parameters:
- reasoning: "My analysis of the problem..."
- useDefaultSession: true
- mode: "critical"
- tags: ["analysis", "problem-solving"]
```

### list_sessions
List all available thinking sessions.

**Example instruction to Claude:**
```
Claude, please list all my thinking sessions using the list_sessions tool.
```

### view_session
View the complete contents of a thinking session.

**Example instruction to Claude:**
```
Claude, please view my thinking session with ID "session_1720529347123_ab7c9".
```

Or to view the default session:
```
Claude, please view my default thinking session.
```

### set_default_session
Set or reset the default thinking session.

**Example instruction to Claude:**
```
Claude, please set session "session_1720529347123_ab7c9" as my default thinking session.
```

Or to clear the default:
```
Claude, please clear my default thinking session.
```

### delete_session
Delete a thinking session.

**Example instruction to Claude:**
```
Claude, please delete my thinking session with ID "session_1720529347123_ab7c9".
```

### cleanup_sessions
Manually clean up old thinking sessions.

**Example instruction to Claude:**
```
Claude, please clean up my thinking sessions older than 60 days.
```

## Session Storage

Sessions are stored locally on your device in:
- **Windows**: `%USERPROFILE%\.minimal-think-sessions`
- **macOS**: `~/.minimal-think-sessions`
- **Linux**: `~/.minimal-think-sessions`

Sessions are preserved indefinitely by default and survive device shutdowns, allowing you to resume thinking processes even after long periods of time.

## Default Session Feature

The default session feature enables you to:

1. **Set a Default**: Mark any session as the default by asking Claude to use `setAsDefault: true`
2. **Automatic Continuation**: Ask Claude to use `useDefaultSession: true` to continue the default session without specifying its ID
3. **Cross-Chat Continuity**: Continue the same thinking process across multiple Claude chats
4. **Reset When Needed**: Ask Claude to clear the default session when you want to start fresh

By default, a new session is created each time unless you explicitly ask Claude to use the default session.

## Research Background

This implementation is based on Anthropic's engineering research demonstrating that a "think" tool creates dedicated space for structured thinking, resulting in:

- **54% improvement** in customer service simulations
- **Better policy adherence** in complex scenarios  
- **Enhanced multi-step problem solving** capabilities
- **More consistent decision making** across tasks

The tool is specifically designed for situations where Claude needs to process external data and doesn't have all necessary information from the initial query.

## Architecture

- **Server**: Native JavaScript MCP server using official SDK
- **Storage**: File-based persistent session storage
- **Transport**: StdioServerTransport for maximum compatibility
- **Tools**: Multiple tools for thinking and session management
- **Output**: Structured JSON with preserved reasoning and session context
- **Dependencies**: Minimal - only `@modelcontextprotocol/sdk` and Node.js standard libraries

## Development

```bash
# Clone repository
git clone https://github.com/differentstuff/minimal-think-mcp.git
cd minimal-think-mcp

# Install dependencies  
npm install

# Start development server
npm start
```

## Testing

Test the server locally:

```bash
# Run with stdio transport
node index.js

# Test with MCP Inspector (if available)
npx @modelcontextprotocol/inspector minimal-think-mcp
```

## Performance

- **Startup time**: < 100ms
- **Memory usage**: < 20MB 
- **Response time**: < 10ms for typical reasoning text
- **Zero processing overhead**: Direct text preservation
- **Session storage**: Efficient file-based storage

## Comparison with Extended Thinking

| Feature | Think Tool | Extended Thinking |
|---------|------------|-------------------|
| **Use Case** | Complex tool use, external data processing | Simple instruction following |
| **Interference** | Zero cognitive overhead | Built-in processing |  
| **Performance** | Optimized for tool chaining | Optimized for single responses |
| **Persistence** | Long-term session storage | Typically session-based |
| **Output** | Structured JSON | Direct text |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable  
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Links

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Anthropic Think Tool Research](https://www.anthropic.com/engineering/claude-think-tool)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop](https://claude.ai/desktop)

---

**Note**: This tool requires Node.js 18+ and is optimized for use with Claude Desktop and the Model Context Protocol ecosystem.
