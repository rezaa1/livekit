import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks
} from '@livekit/components-react';
import '@livekit/components-styles';
import './App.css';

// This is a workaround for the TypeScript error with LiveKitRoom
const LiveKitRoomComponent = LiveKitRoom as any;

// Define interface for error data
interface ErrorResponse {
  error: string;
  details?: string;
  [key: string]: any;
}

function App() {
  const [token, setToken] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [participantName, setParticipantName] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fetchDetails, setFetchDetails] = useState<string>('');

  const handleJoinRoom = async () => {
    if (!roomName || !participantName) {
      setError('Room name and participant name are required');
      return;
    }

    setIsConnecting(true);
    setError('');
    setFetchDetails('');

    try {
      // Generate a unique participant identity
      const participantIdentity = `${participantName}-${Date.now()}`;
      
      // Log the request details
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
      const endpoint = `${backendUrl}/api/generate-token`;
      const requestBody = {
        roomName,
        participantName,
        participantIdentity,
      };
      
      console.log(`Sending request to: ${endpoint}`);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      // Request token from backend
      setFetchDetails(`Sending request to: ${endpoint}\nRequest body: ${JSON.stringify(requestBody, null, 2)}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }).catch(err => {
        const errorDetails = `Fetch error: ${err.message}`;
        console.error(errorDetails);
        setFetchDetails(prev => `${prev}\n${errorDetails}`);
        throw new Error(errorDetails);
      });

      console.log('Response status:', response.status);
      setFetchDetails(prev => `${prev}\nResponse status: ${response.status}`);
      
      if (!response.ok) {
        let errorData: ErrorResponse = { error: 'Unknown error' };
        try {
          errorData = await response.json();
          console.error('Error response:', errorData);
          setFetchDetails(prev => `${prev}\nError response: ${JSON.stringify(errorData, null, 2)}`);
        } catch (e) {
          const responseText = await response.text();
          console.error('Error response text:', responseText);
          setFetchDetails(prev => `${prev}\nError response text: ${responseText}`);
          throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
        }
        throw new Error(errorData.error || 'Failed to get token');
      }

      const data = await response.json();
      console.log('Token received successfully');
      setFetchDetails(prev => `${prev}\nToken received successfully`);
      setToken(data.token);
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error joining room:', errorMessage);
      setFetchDetails(prev => `${prev}\nError joining room: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setToken('');
    setIsConnected(false);
    setFetchDetails('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>LiveKit Agent Chat</h1>
      </header>
      <main>
        {!isConnected ? (
          <div className="join-form">
            <h2>Join a Room</h2>
            {error && <div className="error">{error}</div>}
            {fetchDetails && (
              <div className="fetch-details">
                <h3>Debug Information:</h3>
                <pre>{fetchDetails}</pre>
              </div>
            )}
            <div className="form-group">
              <label htmlFor="roomName">Room Name:</label>
              <input
                id="roomName"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="participantName">Your Name:</label>
              <input
                id="participantName"
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="form-group">
              <label>Backend URL: {process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}</label>
            </div>
            <div className="form-group">
              <label>LiveKit URL: {process.env.REACT_APP_LIVEKIT_URL || 'ws://localhost:7880'}</label>
            </div>
            <button 
              onClick={handleJoinRoom} 
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Join Room'}
            </button>
          </div>
        ) : (
          <div className="room-container">
            {token && (
              <LiveKitRoomComponent
                token={token}
                serverUrl={process.env.REACT_APP_LIVEKIT_URL || 'ws://localhost:7880'}
                onDisconnected={handleDisconnect}
                data-lk-theme="default"
                style={{ height: 'calc(100vh - 150px)' }}
              >
                <VideoConference />
                <RoomAudioRenderer />
                <ControlBar />
              </LiveKitRoomComponent>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
