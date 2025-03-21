const logger = require('./path/to/logger'); // Adjust the path as necessary

// Define the agent behavior
module.exports = async (session) => {
  logger.info(`Agent session started`);
  
  // Initialize OpenAI plugin if API key is available
  let openai;
  if (process.env.OPENAI_API_KEY) {
    logger.info(`Initializing OpenAI plugin`);
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
      
      logger.info(`OpenAI LLM initialized successfully`);
    } catch (err) {
      logger.error(`Failed to initialize OpenAI LLM:`, err);
    }
  } else {
    logger.warn(`OpenAI API key not provided. Agent will run without AI capabilities.`);
  }
  
  // Subscribe to user audio
  try {
    logger.info(`Getting participant from session`);
    const userParticipant = await session.getParticipant();
    if (!userParticipant) {
      logger.error(`No user participant found`);
      return;
    }
    
    logger.info(`Found participant: ${userParticipant.identity}`);
    
    // Subscribe to user's audio track
    logger.info(`Getting audio track`);
    const audioTrack = await userParticipant.getTrack('audio');
    if (audioTrack) {
      logger.info(`Found audio track, subscribing`);
      await session.subscribe(audioTrack);
      logger.info(`Subscribed to user audio track`);
    } else {
      logger.warn(`No audio track found for user`);
    }
  } catch (err) {
    logger.error(`Error subscribing to user audio:`, err);
  }
  
  // Keep the session alive
  logger.info(`Keeping session alive`);
  await new Promise((resolve) => {
    // This will keep the agent running until the session ends
    session.once('close', () => {
      logger.info(`Session closed`);
      resolve();
    });
  });
};
