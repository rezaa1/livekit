require('dotenv').config();
const express = require('express');
const { AccessToken } = require('@livekit/protocol');
const { Agent } = require('@livekit/agents');
const { OpenAIPlugin } = require('@livekit/agents-plugin-openai');
const path = require('path');

// Initialize Express app
const app = express();
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  console.log(`[${new Date().toISOString()}] CORS request: ${req.method} ${req.url}`);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`[${new Date().toISOString()}] Request headers:`, req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`[${new Date().toISOString()}] Request body:`, JSON.stringify(req.body, null, 2));
  }
  
  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`[${new Date().toISOString()}] Response status:`, res.statusCode);
    console.log(`[${new Date().toISOString()}] Response headers:`, res.getHeaders());
    if (body) {
      console.log(`[${new Date().toISOString()}] Response body:`, typeof body === 'string' ? body : JSON.stringify(body, null, 2));
    }
    return originalSend.call(this, body);
  };
  
  next();
});

// Environment variables
const PORT = process.env.PORT || 8080;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

console.log(`[${new Date().toISOString()}] Environment variables:`);
console.log(`[${new Date().toISOString()}] PORT: ${PORT}`);
console.log(`[${new Date().toISOString()}] LIVEKIT_URL: ${LIVEKIT_URL}`);
console.log(`[${new Date().toISOString()}] LIVEKIT_API_KEY: ${LIVEKIT_API_KEY ? 'Set' : 'Not set'}`);
console.log(`[${new Date().toISOString()}] LIVEKIT_API_SECRET: ${LIVEKIT_API_SECRET ? 'Set' : 'Not set'}`);
console.log(`[${new Date().toISOString()}] OPENAI_API_KEY: ${OPENAI_API_KEY ? 'Set' : 'Not set'}`);

// Middleware to check if LiveKit environment variables are set
const checkLiveKitEnv = (req, res, next) => {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.error(`[${new Date().toISOString()}] LiveKit environment variables not set`);
    return res.status(500).json({ error: 'LiveKit environment variables not set' });
  }
  next();
};

// API routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Create a new room
app.post('/api/create-room', checkLiveKitEnv, async (req, res) => {
  try {
    const { roomName } = req.body;
    
    if (!roomName) {
      console.error(`[${new Date().toISOString()}] Room name is required`);
      return res.status(400).json({ error: 'Room name is required' });
    }
    
    // In a production app, you would use the LiveKit Server SDK to create a room
    // For this example, we'll just return success as the room will be created automatically
    console.log(`[${new Date().toISOString()}] Room created: ${roomName}`);
    res.status(200).json({ roomName });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error creating room:`, error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Generate a token for a room
app.post('/api/generate-token', checkLiveKitEnv, (req, res) => {
  try {
    const { roomName, participantName, participantIdentity } = req.body;
    
    if (!roomName || !participantName || !participantIdentity) {
      console.error(`[${new Date().toISOString()}] Missing required fields for token generation`);
      return res.status(400).json({ 
        error: 'Room name, participant name, and participant identity are required' 
      });
    }
    
    console.log(`[${new Date().toISOString()}] Generating token for room: ${roomName}, participant: ${participantName}, identity: ${participantIdentity}`);
    console.log(`[${new Date().toISOString()}] Using LIVEKIT_URL: ${LIVEKIT_URL}`);
    console.log(`[${new Date().toISOString()}] Using LIVEKIT_API_KEY: ${LIVEKIT_API_KEY}`);
    
    // Create access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantName,
    });
    
    // Grant permissions
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });
    
    // Generate token
    const token = at.toJwt();
    console.log(`[${new Date().toISOString()}] Token generated successfully`);
    
    res.status(200).json({ token });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error generating token:`, error);
    res.status(500).json({ error: 'Failed to generate token', details: error.message });
  }
});

// Handle OPTIONS requests explicitly
app.options('*', (req, res) => {
  console.log(`[${new Date().toISOString()}] Handling OPTIONS request`);
  res.status(200).end();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Unhandled error:`, err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`);
});

// Define the agent behavior
const agentBehavior = async (session) => {
  console.log(`[${new Date().toISOString()}] Agent session started`);
  
  // Initialize OpenAI plugin if API key is available
  let openai;
  if (OPENAI_API_KEY) {
    console.log(`[${new Date().toISOString()}] Initializing OpenAI plugin`);
    openai = new OpenAIPlugin({
      apiKey: OPENAI_API_KEY,
    });
    
    // Configure the LLM with a custom prompt
    const systemPrompt = "You are a helpful assistant that speaks in a friendly tone. Your job is to assist users with their questions and provide informative responses.";
    
    try {
      const llm = await openai.createLLM({
        model: "gpt-4",
        systemPrompt: systemPrompt
      });
      
      console.log(`[${new Date().toISOString()}] OpenAI LLM initialized successfully`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Failed to initialize OpenAI LLM:`, err);
    }
  } else {
    console.warn(`[${new Date().toISOString()}] OpenAI API key not provided. Agent will run without AI capabilities.`);
  }
  
  // Subscribe to user audio
  try {
    console.log(`[${new Date().toISOString()}] Getting participant from session`);
    const userParticipant = await session.getParticipant();
    if (!userParticipant) {
      console.error(`[${new Date().toISOString()}] No user participant found`);
      return;
    }
    
    console.log(`[${new Date().toISOString()}] Found participant: ${userParticipant.identity}`);
    
    // Subscribe to user's audio track
    console.log(`[${new Date().toISOString()}] Getting audio track`);
    const audioTrack = await userParticipant.getTrack('audio');
    if (audioTrack) {
      console.log(`[${new Date().toISOString()}] Found audio track, subscribing`);
      await session.subscribe(audioTrack);
      console.log(`[${new Date().toISOString()}] Subscribed to user audio track`);
    } else {
      console.warn(`[${new Date().toISOString()}] No audio track found for user`);
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error subscribing to user audio:`, err);
  }
  
  // Keep the session alive
  console.log(`[${new Date().toISOString()}] Keeping session alive`);
  await new Promise((resolve) => {
    // This will keep the agent running until the session ends
    session.once('close', () => {
      console.log(`[${new Date().toISOString()}] Session closed`);
      resolve();
    });
  });
};

// Start the agent worker
const startAgent = async () => {
  try {
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      console.error(`[${new Date().toISOString()}] LiveKit environment variables not set. Agent will not start.`);
      return;
    }
    
    console.log(`[${new Date().toISOString()}] Creating Agent instance`);
    console.log(`[${new Date().toISOString()}] Using LIVEKIT_URL: ${LIVEKIT_URL}`);
    console.log(`[${new Date().toISOString()}] Using LIVEKIT_API_KEY: ${LIVEKIT_API_KEY}`);
    
    // Create a new Agent instance
    const agent = new Agent({
      url: LIVEKIT_URL,
      apiKey: LIVEKIT_API_KEY,
      apiSecret: LIVEKIT_API_SECRET,
      behavior: agentBehavior
    });
    
    console.log(`[${new Date().toISOString()}] Starting agent`);
    await agent.start();
    console.log(`[${new Date().toISOString()}] LiveKit Agent worker started successfully`);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log(`[${new Date().toISOString()}] Shutting down...`);
      await agent.stop();
      server.close();
      process.exit(0);
    });
    
    return agent;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Failed to start agent:`, err);
    return null;
  }
};

// Start the agent if this file is run directly
if (require.main === module) {
  if (OPENAI_API_KEY) {
    console.log(`[${new Date().toISOString()}] Starting LiveKit Agent with OpenAI integration...`);
    startAgent();
  } else {
    console.log(`[${new Date().toISOString()}] OpenAI API key not provided. To enable the agent, add OPENAI_API_KEY to your .env file.`);
    console.log(`[${new Date().toISOString()}] Server running without LiveKit Agent.`);
  }
}

// Export for testing
module.exports = { app, agentBehavior };
