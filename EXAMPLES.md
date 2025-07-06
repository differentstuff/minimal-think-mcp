# Think Tool Usage Examples

This document provides examples of how to effectively use the minimal think tool for enhanced problem-solving.

## Basic Usage

### Simple Reasoning
```text
Input: "I need to determine the best approach for this API design problem."

Output: 
{
  "thinking": "I need to determine the best approach for this API design problem.",
  "timestamp": "2025-07-06T10:30:00.000Z", 
  "preserved": true
}
```

### Multi-Step Analysis
```text
Input: "Let me break down this complex issue:
1. Understanding the requirements
2. Identifying constraints 
3. Evaluating trade-offs
4. Selecting optimal solution"

Output:
{
  "thinking": "Let me break down this complex issue:\n1. Understanding the requirements\n2. Identifying constraints\n3. Evaluating trade-offs\n4. Selecting optimal solution",
  "timestamp": "2025-07-06T10:30:00.000Z",
  "preserved": true  
}
```

## Advanced Scenarios

### Policy Adherence Check
```text
Input: "Before proceeding with this user request, I need to verify:
- Does this comply with our data privacy policy?
- Are there any security implications? 
- Do I have sufficient context to provide a safe response?
- What additional information might I need?"
```

### Multi-Tool Coordination  
```text
Input: "I'm about to use several tools in sequence. Let me plan:
1. First, search for recent documentation
2. Then analyze the current codebase
3. Finally, propose specific changes
4. Each step depends on the previous results"
```

### Problem Decomposition
```text
Input: "This seems like a complex problem that I should decompose:

Problem: Design a scalable microservices architecture

Sub-problems:
- Service boundary identification
- Communication patterns
- Data consistency strategies  
- Monitoring and observability
- Deployment strategies

I'll tackle each systematically..."
```

## When to Use the Think Tool

### ✅ Recommended Scenarios
- **Complex multi-step problems** requiring structured reasoning
- **Policy adherence checks** before taking actions
- **Tool coordination** when using multiple MCP tools
- **External data processing** where context is gradually built
- **Decision making** with multiple variables and constraints

### ❌ Not Recommended For
- **Simple, direct questions** with obvious answers
- **Basic instruction following** without complexity  
- **Single-step calculations** or lookups
- **Creative writing** where thinking might interfere with flow

## Integration Patterns

### With Other MCP Tools
```text
1. Use think tool to plan approach
2. Execute planned tools in sequence
3. Use think tool to synthesize results
4. Provide final recommendation
```

### Error Recovery
```text
1. Encounter unexpected tool result
2. Use think tool to analyze what went wrong
3. Adjust strategy based on analysis
4. Retry with refined approach
```

## Performance Tips

- **Be specific**: Detailed reasoning gets preserved exactly
- **Structure clearly**: Use numbered lists, bullets, sections
- **Think incrementally**: Break complex reasoning into chunks  
- **Document assumptions**: Make your thinking process explicit

## Example Session

```text
User: "Help me design a database schema for a social media platform"

Claude: I'll use the think tool to structure my approach systematically.

*Uses think tool*:
"This is a complex database design problem. Let me approach it systematically:

1. Core Entities Analysis:
   - Users (profiles, authentication, preferences)
   - Posts (content, metadata, relationships)  
   - Interactions (likes, comments, shares)
   - Relationships (followers, friends, blocks)

2. Scale Considerations:
   - Read vs write patterns (likely read-heavy)
   - Data growth projections
   - Geographic distribution needs

3. Schema Design Priorities:
   - Query performance for feeds
   - Data consistency requirements
   - Privacy and security constraints

Let me start with the user entity design..."

*Proceeds with structured database design based on this thinking*
```

This demonstrates how the think tool creates dedicated space for complex reasoning while preserving the complete thought process for reference and tool chaining.
