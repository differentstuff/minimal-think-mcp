# Persistent Sessions Examples

This document provides examples of how to use the persistent session features in minimal-think-mcp.

## Basic Thinking Session

Start a new thinking session:

```json
{
  "reasoning": "Let me think about implementing a new authentication system for our application:
1. We need to support both traditional username/password and OAuth providers
2. Security requirements include MFA and account recovery options
3. User experience must be seamless across multiple devices"
}
```

Response:

```json
{
  "thinking": "Let me think about implementing a new authentication system for our application:\n1. We need to support both traditional username/password and OAuth providers\n2. Security requirements include MFA and account recovery options\n3. User experience must be seamless across multiple devices",
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

## Continuing a Session

Continue the previous session by using the returned sessionId:

```json
{
  "reasoning": "Now, let's explore the OAuth integration options:
- Google OAuth offers simple integration but limited customization
- Auth0 provides extensive features but has cost implications 
- Firebase Authentication balances ease of use with sufficient features
- Custom implementation gives maximum control but requires more development time",
  "sessionId": "session_1720529347123_ab7c9",
  "mode": "creative",
  "tags": ["authentication", "oauth"]
}
```

Response:

```json
{
  "thinking": "Now, let's explore the OAuth integration options:\n- Google OAuth offers simple integration but limited customization\n- Auth0 provides extensive features but has cost implications \n- Firebase Authentication balances ease of use with sufficient features\n- Custom implementation gives maximum control but requires more development time",
  "thoughtId": 2,
  "sessionId": "session_1720529347123_ab7c9",
  "mode": "creative",
  "tags": ["authentication", "oauth"],
  "timestamp": "2025-07-06T10:35:00.000Z",
  "thoughtCount": 2,
  "preserved": true,
  "usingDefaultSession": false,
  "isDefaultSession": false
}
```

## Using Different Thinking Modes

Switch to a critical thinking mode for evaluation:

```json
{
  "reasoning": "Let's critically evaluate the options based on our requirements:
1. Feature Requirements:
   - Google OAuth lacks MFA controls
   - Auth0 offers comprehensive features
   - Firebase has good but limited MFA options
   - Custom would require implementing everything

2. Development Effort:
   - Google OAuth: Low effort
   - Auth0: Medium initial setup, low maintenance
   - Firebase: Low-medium effort
   - Custom: High effort, high maintenance

3. Cost Analysis:
   - Google OAuth: Free tier sufficient
   - Auth0: Expensive at scale
   - Firebase: Reasonable pricing
   - Custom: High initial development cost",
  "sessionId": "session_1720529347123_ab7c9",
  "mode": "critical",
  "tags": ["authentication", "evaluation"]
}
```

Response:

```json
{
  "thinking": "Let's critically evaluate the options based on our requirements:\n1. Feature Requirements:\n   - Google OAuth lacks MFA controls\n   - Auth0 offers comprehensive features\n   - Firebase has good but limited MFA options\n   - Custom would require implementing everything\n\n2. Development Effort:\n   - Google OAuth: Low effort\n   - Auth0: Medium initial setup, low maintenance\n   - Firebase: Low-medium effort\n   - Custom: High effort, high maintenance\n\n3. Cost Analysis:\n   - Google OAuth: Free tier sufficient\n   - Auth0: Expensive at scale\n   - Firebase: Reasonable pricing\n   - Custom: High initial development cost",
  "thoughtId": 3,
  "sessionId": "session_1720529347123_ab7c9",
  "mode": "critical",
  "tags": ["authentication", "evaluation"],
  "timestamp": "2025-07-06T10:40:00.000Z",
  "thoughtCount": 3,
  "preserved": true,
  "usingDefaultSession": false,
  "isDefaultSession": false
}
```

## Using the Default Session Feature

### Setting a Default Session

You can set a session as the default in two ways:

1. When creating a new thought, add the `setAsDefault` parameter:

```json
{
  "reasoning": "Starting a new thinking process about our cloud migration strategy...",
  "setAsDefault": true
}
```

Response:

```json
{
  "thinking": "Starting a new thinking process about our cloud migration strategy...",
  "thoughtId": 1,
  "sessionId": "session_1720540147123_cd8e5",
  "mode": "linear",
  "tags": [],
  "timestamp": "2025-07-06T11:30:00.000Z",
  "thoughtCount": 1,
  "preserved": true,
  "usingDefaultSession": false,
  "isDefaultSession": true
}
```

2. Or use the dedicated tool to set an existing session as default:

```json
{
  "sessionId": "session_1720529347123_ab7c9"
}
```

Response:

```json
{
  "status": "success",
  "message": "Default session set to session_1720529347123_ab7c9",
  "timestamp": "2025-07-06T11:35:00.000Z"
}
```

### Automatically Using the Default Session

Once you've set a default session, you can continue it without specifying the session ID:

```json
{
  "reasoning": "Next steps in our authentication implementation strategy...",
  "useDefaultSession": true
}
```

Response:

```json
{
  "thinking": "Next steps in our authentication implementation strategy...",
  "thoughtId": 4,
  "sessionId": "session_1720529347123_ab7c9",
  "mode": "linear",
  "tags": [],
  "timestamp": "2025-07-06T11:40:00.000Z",
  "thoughtCount": 4,
  "preserved": true,
  "usingDefaultSession": true,
  "isDefaultSession": true
}
```

### Viewing the Default Session

You can view the default session without specifying its ID:

```json
{}
```

Response:

```json
{
  "sessionId": "session_1720529347123_ab7c9",
  "thoughts": [
    {
      "id": 1,
      "content": "Let me think about implementing a new authentication system for our application:\n1. We need to support both traditional username/password and OAuth providers\n2. Security requirements include MFA and account recovery options\n3. User experience must be seamless across multiple devices",
      "mode": "linear",
      "tags": [],
      "timestamp": "2025-07-06T10:30:00.000Z"
    },
    // Additional thoughts...
  ],
  "count": 4,
  "timestamp": "2025-07-06T11:45:00.000Z",
  "usingDefaultSession": true
}
```

### Resetting the Default Session

Clear the default session when you want to start fresh:

```json
{}
```

Response:

```json
{
  "status": "success",
  "message": "Default session cleared",
  "timestamp": "2025-07-06T11:50:00.000Z"
}
```

## Using Default Sessions Across Different Chats

The default session feature is especially powerful for working across multiple Claude chats:

1. In Chat A:
   ```json
   {
     "reasoning": "Starting research on quantum computing applications...",
     "setAsDefault": true
   }
   ```

2. Close Chat A and start a new Chat B with Claude

3. In Chat B, continue the same thinking process:
   ```json
   {
     "reasoning": "Continuing my quantum computing research from yesterday...",
     "useDefaultSession": true
   }
   ```

This automatically connects to the previous session without needing to remember and copy the session ID.

## Session Management

### List all sessions:

```json
{}
```

Response:

```json
{
  "sessions": [
    {
      "sessionId": "session_1720529347123_ab7c9",
      "thoughtCount": 4,
      "firstThought": "2025-07-06T10:30:00.000Z",
      "lastThought": "2025-07-06T11:40:00.000Z",
      "lastModified": "2025-07-06T11:40:00.000Z",
      "isDefault": true
    },
    {
      "sessionId": "session_1720540147123_cd8e5",
      "thoughtCount": 1,
      "firstThought": "2025-07-06T11:30:00.000Z",
      "lastThought": "2025-07-06T11:30:00.000Z",
      "lastModified": "2025-07-06T11:30:00.000Z",
      "isDefault": false
    }
  ],
  "count": 2,
  "defaultSessionId": "session_1720529347123_ab7c9",
  "timestamp": "2025-07-06T12:00:00.000Z"
}
```

### View a specific session:

```json
{
  "sessionId": "session_1720529347123_ab7c9"
}
```

Response:

```json
{
  "sessionId": "session_1720529347123_ab7c9",
  "thoughts": [
    {
      "id": 1,
      "content": "Let me think about implementing a new authentication system for our application:\n1. We need to support both traditional username/password and OAuth providers\n2. Security requirements include MFA and account recovery options\n3. User experience must be seamless across multiple devices",
      "mode": "linear",
      "tags": [],
      "timestamp": "2025-07-06T10:30:00.000Z"
    },
    // Additional thoughts...
  ],
  "count": 4,
  "timestamp": "2025-07-06T12:05:00.000Z",
  "usingDefaultSession": false
}
```

### Delete a session:

```json
{
  "sessionId": "session_1720540147123_cd8e5"
}
```

Response:

```json
{
  "status": "success",
  "message": "Session session_1720540147123_cd8e5 deleted successfully",
  "wasDefault": false,
  "timestamp": "2025-07-06T12:10:00.000Z"
}
```

### Clean up old sessions:

```json
{
  "maxAgeDays": 60
}
```

Response:

```json
{
  "status": "success",
  "deletedCount": 2,
  "maxAgeDays": 60,
  "message": "Deleted 2 sessions older than 60 days",
  "timestamp": "2025-07-06T12:15:00.000Z"
}
```

## Resuming a Session Days Later

The key benefit of persistent sessions is the ability to continue a thinking process days, weeks, or even months later:

1. Start a session on Monday (and optionally set it as default)
2. Shut down your computer
3. Come back a week later and use either:
   - The specific sessionId if you have it
   - `"useDefaultSession": true` if you set it as default
4. All your previous thoughts are preserved and you can continue right where you left off

This makes it perfect for long-term thinking projects, complex problem-solving tasks, and iterative reasoning that spans multiple work sessions.
