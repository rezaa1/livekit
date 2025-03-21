// Define the agent behavior
module.exports = async (session) => {
  console.log(`[${new Date().toISOString()}] Agent session started`);
  
  // Initialize OpenAI plugin if API key is available
  let openai;
  if (process.env.OPENAI_API_KEY) {
    console.log(`[${new Date().toISOString()}] Initializing OpenAI plugin`);
    const { OpenAIPlugin } = require('@livekit/agents-plugin-openai');
    
    openai = new OpenAIPlugin({
      apiKey: process.env.OPENAI_API_KEY,
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
