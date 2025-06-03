const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fetch = require('node-fetch');
const mqtt = require('mqtt'); 

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));
app.use(express.json());

// MQTT setup
const mqttClient = mqtt.connect('mqtt://localhost'); // or use IP if running broker elsewhere

mqttClient.on('connect', () => {
  console.log('✅ MQTT connected');
  mqttClient.subscribe('clearview/alerts');
});

mqttClient.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    console.log('[MQTT] Incoming:', payload);
    if (payload.side && typeof payload.distance === 'number') {
      io.emit('sensorAlert', payload); // → Send to web UI via WebSocket
    }
  } catch (err) {
    console.error('❌ Invalid MQTT payload:', message.toString());
  }
});

// WebSocket client logs
io.on('connection', (socket) => {
  console.log('✅ Web client connected');
});

// Fallback POST for old HTTP method (optional)
app.post('/sensor', (req, res) => {
  const { side, distance } = req.body;
  console.log('[POST /sensor] Incoming payload:', req.body);

  if (side && distance !== undefined) {
    io.emit('sensorAlert', { side, distance });
    console.log(`📡 ${side.toUpperCase()} alert: ${distance} cm`);
    res.sendStatus(200);
  } else {
    res.status(400).send("Invalid payload");
  }
});

// Spotify OAuth handler
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  const data = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: 'http://localhost:3000/callback',
    client_id: 'ed27725761544113b8b9ea9bafde8e11',
    client_secret: '47d906edd28e416c95d348cfc568bef3'
  });

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data.toString()
    });

    const tokenData = await response.json();

    if (tokenData.access_token) {
      console.log('✅ Spotify token received');
      res.redirect(`/?spotify_token=${tokenData.access_token}`);
    } else {
      console.error('Spotify error:', tokenData);
      res.send('Failed to get token');
    }

  } catch (err) {
    console.error('Error exchanging token:', err);
    res.status(500).send('Token exchange failed.');
  }
});

// Start server
server.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});
