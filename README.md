## ClearView
ClearView is an experimental HCI prototype designed for cyclists and motorcyclists. It provides real-time blind spot alerts using an ESP32 microcontroller and ultrasonic sensors. Alerts are transmitted over MQTT and displayed in a custom web-based UI with audio and visual feedback — simulating a smart visor heads-up display.

## Features
Flashing red UI indicators when an object is detected

Directional audio beeps (left, right, rear)

Live distance data shown on screen

Real-time MQTT communication between ESP32 and browser

Optional Spotify integration using OAuth

Google Maps route planning and location UI

## Tech Stack
Component	Tech Used
Hardware	ESP32, Ultrasonic sensors, LEDs, Buzzers
Communication	MQTT (PubSubClient on ESP32), Socket.IO
Backend Server	Node.js, Express.js, MQTT broker
Frontend UI	HTML, CSS, JavaScript
Audio/UX	Web Audio API, SpeechSynthesis
OAuth	Spotify Developer API
Navigation	Google Maps API

## Requirements

#### Hardware

ESP32 Dev Module

HC-SR04 Ultrasonic sensors (3x: left, right, rear)

LEDs (2x: left, right)

Buzzers (2x: left, right)

Breadboard + jumper wires

#### Software

Node.js (v16+ recommended)

Mosquitto MQTT Broker

Arduino IDE

VS Code (optional, for editing the web UI)

Chrome browser (preferred for Web Audio API support)

## How to Run

1. Clone the Repo
git clone https://github.com/bellewills/HCI.git  
cd HCI
2. Install Dependencies
npm install

This installs:

express

socket.io

mqtt

node-fetch

3. Start MQTT Broker
If installed via Homebrew:
brew services start mosquitto
Or manually:
bash
mosquitto
4. Flash the ESP32
Upload the .ino sketch to your ESP32 using the Arduino IDE. Update:

cpp
const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* mqtt_server = "YOUR_COMPUTER_IP"; // e.g. 192.168.1.96
5. Start the Server
bash 
node server.js
Then open your browser and go to:
http://localhost:3000

## Network Requirements

ESP32 and your computer must be on the same Wi-Fi network

Use your local IP address for the mqtt_server

Ensure port 1883 (MQTT) and port 3000 (HTTP) are not blocked

## Testing Sensor Alerts

Move your hand near the ultrasonic sensors. The UI will:

Flash red on the corresponding side

Play directional beeps

Show live distance data in cm

Spotify Integration (Optional)
Click “Connect Spotify” on the login screen

Authorise with your Spotify account

Your top 3 tracks will appear in the left panel


## Made By
Belle Williams and Keya Datta — UAL BSc Computer Science (HCI Project)

## Github Link
https://github.com/bellewills/HCI
