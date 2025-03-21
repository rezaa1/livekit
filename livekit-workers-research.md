# LiveKit Workers Research

## LiveKit Agents Framework

LiveKit Agents is a framework for building realtime, multimodal AI agents that can be deployed as stateful, long-running processes. These agents connect to the LiveKit network via WebRTC, enabling low-latency, realtime media and data exchange with frontend applications.

### Key Concepts

- **Agent**: A function that defines the workflow of a programmable, server-side participant
- **Worker**: A container process responsible for managing job queuing with LiveKit server
- **Plugin**: A library class that performs a specific task (e.g., speech-to-text, text-to-speech)

### How Workers Function

1. Workers connect to LiveKit server via WebSocket
2. Workers register themselves and wait for jobs
3. When a room is created, the server notifies a worker about a new job
4. The worker accepts the job and instantiates an agent as a participant
5. The agent joins the room and can interact with other participants

### Deployment Considerations

- Workers are stateless and don't require persistent storage
- Workers communicate with LiveKit via WebSocket, no need to expose to public internet
- Workers can be deployed in Docker containers
- Load balancing is handled automatically by LiveKit
- Workers stop accepting jobs when they receive SIGINT or SIGTERM
- Agents that are still running continue to run until completion

### Available SDKs

- Python: More mature version with larger number of integrations
- Node.js: Beta version with growing plugin ecosystem

### Plugins Available (Node.js)

- OpenAI: STT, LLM, TTS, Realtime API
- Deepgram: STT
- ElevenLabs: TTS
- Silero: Voice Activity Detection (VAD)
- LiveKit: End-of-turn detection

### Environment Variables Required

- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- Additional provider API keys (e.g., `OPENAI_API_KEY`)
