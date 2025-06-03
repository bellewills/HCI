const socket = io();

// -------- Get Spotify Token from URL --------
const urlParams = new URLSearchParams(window.location.search);
const spotifyToken = urlParams.get('spotify_token');
if (spotifyToken) {
  localStorage.setItem('spotify_token', spotifyToken);
  window.history.replaceState({}, document.title, "/");
}

// Setup Web Audio API for directional alerts
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// UI sensor labels
const sensorLabels = {
  left: document.getElementById("sensor-left"),
  right: document.getElementById("sensor-right"),
  rear: document.getElementById("sensor-rear"),
};

// Receive sensor alert from ESP32 and update UI
socket.on('sensorAlert', (payload) => {
  console.log('[Client] RAW sensorAlert payload:', payload);  // debug

  const { side, distance } = payload || {};
  if (!side || typeof distance !== 'number') return;

  // Update UI label
  if (sensorLabels[side]) {
    sensorLabels[side].innerText = `${side}: ${distance.toFixed(1)} cm`;
  }

  // Flash logic
  const flashLeft = document.getElementById('flash-left');
  const flashRight = document.getElementById('flash-right');

  if (side === 'left') {
    flashLeft.classList.add('active');
    setTimeout(() => flashLeft.classList.remove('active'), 500);
  } else if (side === 'right') {
    flashRight.classList.add('active');
    setTimeout(() => flashRight.classList.remove('active'), 500);
  } else if (side === 'rear') {
    flashLeft.classList.add('active');
    flashRight.classList.add('active');
    setTimeout(() => {
      flashLeft.classList.remove('active');
      flashRight.classList.remove('active');
    }, 500);
  }

  playPannedBeep(side);
  console.log('[Client] Processed sensorAlert:', side, distance);
});

// Play directional beep using stereo panning
function playPannedBeep(side) {
  const pan = side === 'left' ? -1 : side === 'right' ? 1 : 0;

  fetch('audio/beep.wav')
    .then(res => res.arrayBuffer())
    .then(buf => audioCtx.decodeAudioData(buf))
    .then(audioBuffer => {
      const source = audioCtx.createBufferSource();
      const panner = audioCtx.createStereoPanner();
      panner.pan.value = pan;
      source.buffer = audioBuffer;
      source.connect(panner).connect(audioCtx.destination);
      source.start();
    });
}

// Login → Main UI
function enterUI() {
  const email = document.querySelector('input[type="email"]').value;
  const password = document.querySelector('input[type="password"]').value;
  if (!email || !password) {
    alert("Please fill in both fields.");
    return;
  }
  document.getElementById('login-wrapper').style.display = 'none';
  document.getElementById('main-ui').style.display = 'flex';

  loadSpotifyTopTracks();
}

// Google Maps Setup
let map, directionsService, directionsRenderer;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 51.5072, lng: -0.1276 },
    zoom: 13,
    disableDefaultUI: true,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  calculateRoute("Victoria Station London", "King's Cross Station London", "WALKING");
}

function calculateRoute(origin, destination, mode = 'WALKING') {
  directionsService.route({
    origin,
    destination,
    travelMode: google.maps.TravelMode[mode],
  }, (res, status) => {
    if (status === "OK") {
      directionsRenderer.setDirections(res);
      speak(`Route set from ${origin} to ${destination} by ${mode.toLowerCase()}`);
    } else {
      alert("Directions request failed: " + status);
    }
  });
}

function updateRoute() {
  const origin = document.getElementById("origin").value;
  const destination = document.getElementById("destination").value;
  const mode = document.getElementById("travel-mode").value;

  if (origin && destination) {
    calculateRoute(origin, destination, mode);
  } else {
    alert("Please enter both origin and destination.");
  }
}

function useCurrentLocation() {
  navigator.geolocation.getCurrentPosition((pos) => {
    const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
    const destination = document.getElementById("destination").value;
    const mode = document.getElementById("travel-mode").value;

    if (destination) {
      calculateRoute(origin, destination, mode);
    } else {
      alert("Please enter a destination.");
    }
  }, () => {
    alert("Failed to get current location.");
  });
}

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utter);
}

function togglePanel(id) {
  const panel = document.getElementById(id);
  const arrow = panel.querySelector('.arrow');
  const isOpen = !panel.classList.contains('collapsed');

  if (isOpen) {
    panel.classList.add('collapsed');
    arrow.textContent = '▼';
  } else {
    panel.classList.remove('collapsed');
    arrow.textContent = '▲';
  }
}

// -------- SPOTIFY SECTION --------
const spotifyTokenFromURL = urlParams.get('spotify_token');
if (spotifyTokenFromURL) {
  localStorage.setItem('spotifyToken', spotifyTokenFromURL);
  window.history.replaceState({}, document.title, "/");
}

const token = localStorage.getItem('spotifyToken');

async function fetchWebApi(endpoint, method = 'GET', body = null) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null
  });
  return res.json();
}

async function getTopTracks() {
  const data = await fetchWebApi('v1/me/top/tracks?time_range=short_term&limit=3');
  return data.items || [];
}

async function loadSpotifyTopTracks() {
  if (!token) return;

  try {
    const topTracks = await getTopTracks();
    const panel = document.querySelector('#left-panel .panel-body');
    const musicBlock = document.createElement('div');
    musicBlock.innerHTML = `<h4>Top Spotify Tracks:</h4>` + topTracks.map(
      ({ name, artists }) =>
        `<p><strong>${name}</strong> by ${artists.map(a => a.name).join(', ')}</p>`
    ).join('');
    panel.appendChild(musicBlock);
  } catch (err) {
    console.error("Spotify fetch failed:", err);
  }
}

window.initMap = initMap;

function connectSpotify() {
  const client_id = 'ed27725761544113b8b9ea9bafde8e11';
  const redirect_uri = 'http://127.0.0.1:3000/callback';
  const scopes = 'user-top-read';

  const authUrl = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${scopes}`;

  window.location.href = authUrl;
}
