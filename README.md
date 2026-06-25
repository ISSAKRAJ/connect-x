# Connect X

> **Zero-Gravity, Zero-Trust Peer-to-Peer Secure Chat, Voice Calling, and File Streaming Platform.**

Connect X is a privacy-first, serverless communication suite that shifts data gravity from centralized servers directly to edge clients. Communication payloads (text, audio, and files) are never stored, logged, or intercepted by a middleman. 

🔗 **Live Deployment URL**: [https://connect-x-eta.vercel.app/](https://connect-x-eta.vercel.app/)

---

## 🚀 Key Features

* **Zero-Gravity Signaling Matchmaker**: The signaling server only handles handshake broker events (`webrtc-offer`, `webrtc-answer`, `ice-candidate`) and steps completely out of the way once the connection is established.
* **Zero-Trust Secure Chat**: Chat messages are encrypted and sent directly client-to-client over WebRTC `RTCDataChannel` pipelines.
* **P2P Audio Mesh Calling**: Multi-peer voice calls are established directly in-browser. Connect X integrates Safari/iOS loudspeaker autoplays and audio elements per peer to mix audio streams seamlessly across all mobile and desktop viewports.
* **Both-Ends Snoop Blur Protection**: Message bubbles (both sent and received) are blurred and text is hex-scrambled on the screen. The user must touch-and-hold (or click-and-hold) a message bubble to decrypt and reveal the content.
* **Particle Stream File Transfer**: Large files are sliced into 16KB binary chunks and streamed over direct data channels using active buffer flow-control to prevent network congestion.
* **On-Device Local AI Engine**: Features a local Hugging Face `Transformers.js` pipeline (`MiniLM-L6-v2`) running directly in the browser. Provides contextual smart replies and offline sentiment analysis without sending any server-side network requests.

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 15 (React, TypeScript, TailwindCSS)
* **Backend Signaling**: Node.js, Express, Socket.io
* **Database & ORM**: SQLite, Prisma
* **Real-time Protocols**: HTML5 WebRTC API, Web Audio API

---

## 📦 Project Structure

```text
├── client/          # Next.js frontend application
│   ├── app/         # App router pages (Chat console, Login, Landing Page)
│   ├── components/  # Responsive layouts and visual overlays
│   └── public/      # Static client assets
│
└── server/          # Node.js Matchmaking Signaling Server
    ├── server.js    # Express & Socket.io server
    └── prisma/      # Database schema and SQLite database
```

---

## 💻 Local Development Setup

Follow these steps to run the complete stack on your local machine:

### Prerequisites

* Node.js (v18 or higher)
* npm (v9 or higher)

---

### Step 1: Set Up Backend Server

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the Prisma database:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Start the server:
   ```bash
   node server.js
   ```
   The backend will start listening on port **`5000`**.

---

### Step 2: Set Up Client Application

1. Navigate to the client directory in a new terminal window:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the Next.js development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## 🔒 Security Principles

1. **No Central Logs**: No message payload, metadata, or media stream ever hits the Express server.
2. **Ephemeral Grouping**: Mesh room connections are managed completely in-memory (RAM-only) and are discarded instantly when peers disconnect.
3. **End-to-Edge Encryption**: Addresses are mapped strictly using Google STUN and custom TURN configurations for secure Symmetric NAT traversal.
