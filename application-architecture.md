# Application Architecture Design

## Overview

This application will be a small web application that allows users to talk to an AI agent using LiveKit for real-time communication. The application will consist of a frontend for user interaction and a backend that runs LiveKit Agents workers in a Docker environment.

## Components

### 1. Frontend
- **Technology**: React.js
- **Purpose**: Provide a user interface for audio/video communication with the AI agent
- **Key Features**:
  - User authentication
  - Audio/video streaming using LiveKit SDK
  - Text chat interface
  - Connection status indicators

### 2. Backend
- **Technology**: Node.js
- **Purpose**: Run LiveKit Agents to handle real-time communication
- **Key Components**:
  - LiveKit Agent worker process
  - API endpoints for room creation and token generation
  - Agent implementation with speech-to-text and text-to-speech capabilities

### 3. Docker Environment
- **Containers**:
  - Frontend container
  - Backend container
  - LiveKit server container (for local development)
- **Networking**: Internal network for container communication

## Data Flow

1. User accesses the frontend application
2. Frontend requests a token from the backend
3. Backend generates a token and creates a room if needed
4. Frontend connects to LiveKit using the token
5. LiveKit server assigns a worker to the room
6. Worker instantiates an agent that joins the room
7. User and agent communicate in real-time via audio/video

## API Endpoints

### Backend API
- `POST /api/create-room`: Create a new LiveKit room
- `POST /api/generate-token`: Generate a token for a specific room and user
- `GET /api/health`: Health check endpoint

## Docker Compose Configuration

The application will use Docker Compose to orchestrate the containers:
- Frontend container exposed on port 3000
- Backend container exposed on port 8080
- LiveKit server container with necessary ports for WebRTC

## Environment Variables

### Backend
- `LIVEKIT_URL`: URL of the LiveKit server
- `LIVEKIT_API_KEY`: API key for LiveKit
- `LIVEKIT_API_SECRET`: API secret for LiveKit
- Additional API keys for AI services (e.g., OpenAI)

### Frontend
- `REACT_APP_BACKEND_URL`: URL of the backend API

## Deployment Considerations

- For production, LiveKit Cloud could be used instead of self-hosted LiveKit server
- HTTPS is required for WebRTC to work properly in production
- Consider implementing authentication for production use
