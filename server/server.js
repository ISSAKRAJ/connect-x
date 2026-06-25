const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

// Enable CORS for frontend connection (Next.js runs on port 3000)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));
app.use(express.json());

// Memory mapping of connectId -> socket.id
const activeSockets = new Map();

// Helper: Generate 6-char alphanumeric connectId
function generateConnectId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// REST APIs
// 1. Register User
app.post('/api/users/register', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username is required' });
    }

    let connectId = '';
    let isUnique = false;
    let attempts = 0;

    // Retry loop to ensure connectId uniqueness
    while (!isUnique && attempts < 10) {
      connectId = generateConnectId();
      const existing = await prisma.user.findUnique({
        where: { connectId }
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique Connect ID. Try again.' });
    }

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        connectId
      }
    });

    return res.status(201).json(newUser);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Login User
app.post('/api/users/login', async (req, res) => {
  try {
    const { connectId } = req.body;
    if (!connectId || connectId.trim() === '') {
      return res.status(400).json({ error: 'Connect ID is required' });
    }

    const user = await prisma.user.findUnique({
      where: { connectId: connectId.trim().toUpperCase() }
    });

    if (!user) {
      return res.status(404).json({ error: 'Invalid Connect ID. User not found.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Get User Connections
app.get('/api/connections/:connectId', async (req, res) => {
  try {
    const { connectId } = req.params;
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { userAConnectId: connectId },
          { userBConnectId: connectId }
        ]
      }
    });
    return res.status(200).json(connections);
  } catch (error) {
    console.error('Get connections error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Socket.io Signaling & Real-time Handshake Server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Register user's connectId to their socket
  socket.on('register-socket', ({ connectId }) => {
    if (connectId) {
      const upperId = connectId.toUpperCase();
      activeSockets.set(upperId, socket.id);
      socket.connectId = upperId;
      console.log(`Socket ${socket.id} registered to Connect ID: ${upperId}`);
      
      // Broadcast online status to peers if needed
      io.emit('peer-status', { connectId: upperId, status: 'online' });
    }
  });

  // Request connection from User A to User B
  socket.on('request-connection', async ({ senderConnectId, targetConnectId, senderUsername }) => {
    try {
      const senderUpper = senderConnectId.toUpperCase();
      const targetUpper = targetConnectId.toUpperCase();

      if (senderUpper === targetUpper) {
        return socket.emit('error-msg', { message: 'You cannot connect to yourself.' });
      }

      // Check if target user exists in DB
      const targetUser = await prisma.user.findUnique({
        where: { connectId: targetUpper }
      });

      if (!targetUser) {
        return socket.emit('error-msg', { message: `User with Connect ID ${targetUpper} not found.` });
      }

      // Check if connection already exists
      const existing = await prisma.connection.findFirst({
        where: {
          OR: [
            { userAConnectId: senderUpper, userBConnectId: targetUpper },
            { userAConnectId: targetUpper, userBConnectId: senderUpper }
          ]
        }
      });

      if (existing) {
        if (existing.status === 'ACCEPTED') {
          return socket.emit('error-msg', { message: 'You are already connected to this peer.' });
        } else {
          return socket.emit('error-msg', { message: 'A connection request is already pending.' });
        }
      }

      // Create connection record
      const connection = await prisma.connection.create({
        data: {
          userAId: '', // We can look these up if needed, but connectId is the primary identity
          userBId: '',
          userAConnectId: senderUpper,
          userBConnectId: targetUpper,
          status: 'PENDING'
        }
      });

      console.log(`Connection requested: ${senderUpper} -> ${targetUpper}`);

      // Forward request to recipient socket if online
      const targetSocketId = activeSockets.get(targetUpper);
      if (targetSocketId) {
        io.to(targetSocketId).emit('connection-request-received', {
          connectionId: connection.id,
          senderConnectId: senderUpper,
          senderUsername
        });
      }
      
      // Let sender know request was sent
      socket.emit('connection-request-sent', { connection });

    } catch (error) {
      console.error('Request connection socket error:', error);
      socket.emit('error-msg', { message: 'Failed to process connection request.' });
    }
  });

  // Accept connection request from User B
  socket.on('accept-connection', async ({ connectionId, recipientConnectId, recipientUsername }) => {
    try {
      const recipientUpper = recipientConnectId.toUpperCase();

      // Find the connection record
      const connection = await prisma.connection.findUnique({
        where: { id: connectionId }
      });

      if (!connection) {
        return socket.emit('error-msg', { message: 'Connection request not found.' });
      }

      // Update connection status
      const updatedConnection = await prisma.connection.update({
        where: { id: connectionId },
        data: { status: 'ACCEPTED' }
      });

      console.log(`Connection accepted: ${connection.userAConnectId} <-> ${connection.userBConnectId}`);

      const senderConnectId = connection.userAConnectId;

      // Get target socket IDs
      const senderSocketId = activeSockets.get(senderConnectId);
      const recipientSocketId = activeSockets.get(recipientUpper);

      // Emit connection-accepted event to both users to trigger the glowing line animation
      if (senderSocketId) {
        io.to(senderSocketId).emit('connection-accepted', {
          connection: updatedConnection,
          peerConnectId: recipientUpper,
          peerUsername: recipientUsername
        });
      }

      // We find the sender's username in the database
      const senderUser = await prisma.user.findUnique({
        where: { connectId: senderConnectId }
      });

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('connection-accepted', {
          connection: updatedConnection,
          peerConnectId: senderConnectId,
          peerUsername: senderUser ? senderUser.username : 'Peer'
        });
      }

    } catch (error) {
      console.error('Accept connection socket error:', error);
      socket.emit('error-msg', { message: 'Failed to accept connection request.' });
    }
  });



  // WebRTC Signaling: Offer forwarding
  socket.on('webrtc-offer', ({ senderConnectId, recipientConnectId, offer }) => {
    const recipientUpper = recipientConnectId.toUpperCase();
    const recipientSocketId = activeSockets.get(recipientUpper);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('webrtc-offer', {
        senderConnectId: senderConnectId.toUpperCase(),
        offer
      });
    }
  });

  // WebRTC Signaling: Answer forwarding
  socket.on('webrtc-answer', ({ senderConnectId, recipientConnectId, answer }) => {
    const recipientUpper = recipientConnectId.toUpperCase();
    const recipientSocketId = activeSockets.get(recipientUpper);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('webrtc-answer', {
        senderConnectId: senderConnectId.toUpperCase(),
        answer
      });
    }
  });

  // WebRTC Signaling: ICE Candidate forwarding
  socket.on('webrtc-ice-candidate', ({ senderConnectId, recipientConnectId, candidate }) => {
    const recipientUpper = recipientConnectId.toUpperCase();
    const recipientSocketId = activeSockets.get(recipientUpper);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('webrtc-ice-candidate', {
        senderConnectId: senderConnectId.toUpperCase(),
        candidate
      });
    }
  });

  // Call termination event
  socket.on('call-terminated', ({ senderConnectId, recipientConnectId }) => {
    const recipientUpper = recipientConnectId.toUpperCase();
    const recipientSocketId = activeSockets.get(recipientUpper);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('call-terminated', {
        senderConnectId: senderConnectId.toUpperCase()
      });
    }
  });

  // Ephemeral Group Matchmaking
  socket.on('join-group', ({ connectId, groupId, username }) => {
    if (!connectId || !groupId) return;
    const upperGroup = groupId.toUpperCase();
    const upperConnect = connectId.toUpperCase();
    
    socket.join(`group:${upperGroup}`);
    socket.groupId = upperGroup;

    // Track active members in-memory
    if (!global.groupMembers) {
      global.groupMembers = new Map();
    }
    if (!global.groupMembers.has(upperGroup)) {
      global.groupMembers.set(upperGroup, new Set());
    }
    const members = global.groupMembers.get(upperGroup);

    // Broadcast join to other members
    socket.to(`group:${upperGroup}`).emit('group-member-joined', {
      connectId: upperConnect,
      username
    });

    members.add(upperConnect);

    // Send the list of current members (excluding self) to the joining user
    const memberList = Array.from(members).filter(id => id !== upperConnect);
    socket.emit('group-joined', {
      groupId: upperGroup,
      members: memberList
    });
    
    console.log(`User ${upperConnect} joined group ${upperGroup}. Members:`, members);
  });

  socket.on('leave-group', ({ connectId, groupId }) => {
    if (!connectId || !groupId) return;
    const upperGroup = groupId.toUpperCase();
    const upperConnect = connectId.toUpperCase();

    socket.leave(`group:${upperGroup}`);
    
    if (global.groupMembers) {
      const members = global.groupMembers.get(upperGroup);
      if (members) {
        members.delete(upperConnect);
        if (members.size === 0) {
          global.groupMembers.delete(upperGroup);
        } else {
          io.to(`group:${upperGroup}`).emit('group-member-left', {
            connectId: upperConnect
          });
        }
      }
    }
    console.log(`User ${upperConnect} left group ${upperGroup}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (socket.connectId) {
      activeSockets.delete(socket.connectId);
      io.emit('peer-status', { connectId: socket.connectId, status: 'offline' });
      
      // If user was in a group, remove them from memory tracking
      if (socket.groupId && global.groupMembers) {
        const members = global.groupMembers.get(socket.groupId);
        if (members) {
          members.delete(socket.connectId);
          if (members.size === 0) {
            global.groupMembers.delete(socket.groupId);
          } else {
            io.to(`group:${socket.groupId}`).emit('group-member-left', {
              connectId: socket.connectId
            });
          }
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Connect X Server listening on port ${PORT}`);
});
