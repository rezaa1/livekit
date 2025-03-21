# LiveKit Agent Constructor Error - Solution

## Problem Identified

The error message indicated a problem with the Agent constructor:

```
Failed to start agent: TypeError: Agent is not a constructor
    at startAgent (/app/server.js:227:19)
```

After investigating, I found two main issues:

1. **Missing Dependencies**: The required packages were defined in package.json but not installed.
2. **Incorrect API Usage**: The LiveKit Agents framework doesn't use `Agent` as a constructor class, but rather as a function that defines the workflow of a programmable server-side participant.

## Solution Implemented

### 1. Installed Missing Dependencies

First, I installed the missing dependencies:

```bash
npm install
```

### 2. Fixed the API Usage

After researching the LiveKit Agents API documentation, I discovered that the correct approach is to use the `Worker` class instead of trying to instantiate `Agent` directly. The Agent is actually a function that defines behavior, not a class to be instantiated.

#### Changes Made:

1. **Updated Import Statement**:
   ```javascript
   // Changed from
   const { Agent } = require('@livekit/agents');
   
   // To
   const { Worker, WorkerOptions } = require('@livekit/agents');
   ```

2. **Created Separate Agent Behavior File**:
   Moved the agent behavior function to a separate file (`agent-behavior.js`) to be loaded by the Worker.

3. **Updated Agent Instantiation**:
   ```javascript
   // Changed from
   const agent = new Agent(agentBehavior, {
     livekitUrl: LIVEKIT_URL,
     apiKey: LIVEKIT_API_KEY,
     apiSecret: LIVEKIT_API_SECRET
   });
   
   // To
   const workerOptions = new WorkerOptions({
     agent: './agent-behavior.js',
     wsURL: LIVEKIT_URL,
     apiKey: LIVEKIT_API_KEY,
     apiSecret: LIVEKIT_API_SECRET
   });
   
   const worker = new Worker(workerOptions);
   ```

4. **Updated Method Calls**:
   ```javascript
   // Changed from
   await agent.start();
   // and
   await agent.stop();
   
   // To
   await worker.run();
   // and
   await worker.close();
   ```

5. **Updated Return Value**:
   ```javascript
   // Changed from
   return agent;
   
   // To
   return worker;
   ```

## Explanation

According to the LiveKit Agents documentation, the framework uses these key concepts:

- **Agent**: A function that defines the workflow of a programmable, server-side participant. This is your application code.
- **Worker**: A container process responsible for managing job queuing with LiveKit server. Each worker is capable of running multiple agents simultaneously.
- **Plugin**: A library class that performs a specific task, e.g. speech-to-text, from a specific provider.

The error occurred because the code was trying to use `Agent` as a constructor class when it's actually meant to be a function that defines behavior. The correct approach is to use the `Worker` class to manage the agent behavior.

## Testing

The code should now work correctly. When the server starts, it will create a Worker instance that loads the agent behavior from the agent-behavior.js file and connects to the LiveKit server.
