# LiveKit Web Application Testing

## Local Testing Instructions

1. Clone the repository to your local machine
2. Create a `.env` file in the root directory with the following variables:
   ```
   LIVEKIT_URL=ws://livekit:7880
   LIVEKIT_API_KEY=devkey
   LIVEKIT_API_SECRET=secret
   ```
3. Run `docker-compose up` to start all services
4. Access the application at http://localhost:3000

## Testing Checklist

- [ ] Verify all containers start successfully
- [ ] Confirm frontend loads at http://localhost:3000
- [ ] Test room creation and joining
- [ ] Verify audio/video streaming works
- [ ] Test agent connection and response
- [ ] Check browser compatibility (Chrome, Firefox, Safari)
- [ ] Test on different devices (desktop, mobile)

## Troubleshooting

### Common Issues

1. **Connection Issues**
   - Check that all environment variables are set correctly
   - Ensure ports 7880, 7881, and 7882 are not in use by other applications
   - Verify network connectivity between containers

2. **Media Access Issues**
   - Ensure browser has permission to access camera and microphone
   - Check that HTTPS is used in production environments

3. **Agent Not Responding**
   - Check backend logs for errors
   - Verify LiveKit server is running properly
   - Ensure agent worker is registered with LiveKit server

## Performance Considerations

- LiveKit server resource usage increases with the number of participants
- For production use, consider using LiveKit Cloud instead of self-hosted server
- Monitor CPU and memory usage during testing
