# Minimal Think MCP

A high-performance JavaScript native MCP server implementing a minimal "think" tool with zero cognitive interference. Based on [Anthropic's research](https://www.anthropic.com/engineering/claude-think-tool) on enhancing Claude's complex problem-solving abilities through dedicated thinking workspaces.

## Overview

This MCP server provides a pure thinking workspace that preserves reasoning text without modification, creating dedicated space for structured thinking during complex tasks. The tool follows the zero-interference principle - it simply preserves and structures your reasoning without any cognitive overhead.

## Features

- **Zero Cognitive Interference**: Pure thinking workspace approach
- **Native MCP Protocol**: Built with `@modelcontextprotocol/sdk` for optimal performance  
- **Instant Deployment**: Ready for `npx` deployment without installation
- **Claude Desktop Compatible**: Works seamlessly with Claude Desktop configuration
- **Minimal Dependencies**: Only the MCP SDK, no bloat
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

The think tool accepts reasoning text and returns it as structured JSON without modification:

### Input
```text
"I need to analyze this complex problem step by step:
1. First, I'll identify the core constraints
2. Then I'll evaluate potential approaches  
3. Finally, I'll synthesize the optimal solution"
```

### Output
```json
{
  "thinking": "I need to analyze this complex problem step by step:\\n1. First, I'll identify the core constraints\\n2. Then I'll evaluate potential approaches\\n3. Finally, I'll synthesize the optimal solution",
  "timestamp": "2025-07-06T10:30:00.000Z",
  "preserved": true
}
```

## Research Background

This implementation is based on Anthropic's engineering research demonstrating that a "think" tool creates dedicated space for structured thinking, resulting in:

- **54% improvement** in customer service simulations
- **Better policy adherence** in complex scenarios  
- **Enhanced multi-step problem solving** capabilities
- **More consistent decision making** across tasks

The tool is specifically designed for situations where Claude needs to process external data and doesn't have all necessary information from the initial query.

## Architecture

- **Server**: Native JavaScript MCP server using official SDK
- **Transport**: StdioServerTransport for maximum compatibility
- **Tool**: Single "think" tool with string input schema
- **Output**: Structured JSON with preserved reasoning
- **Dependencies**: Minimal - only `@modelcontextprotocol/sdk`

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

## Comparison with Extended Thinking

| Feature | Think Tool | Extended Thinking |
|---------|------------|-------------------|
| **Use Case** | Complex tool use, external data processing | Simple instruction following |
| **Interference** | Zero cognitive overhead | Built-in processing |  
| **Performance** | Optimized for tool chaining | Optimized for single responses |
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
