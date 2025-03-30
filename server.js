import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Add a basic route to check if server is running
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Function to generate a random room ID
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result.toLowerCase();
}

// Store room data
const rooms = new Map();

// Function to dispose of empty rooms
const disposeRoom = (roomId) => {
  const room = rooms.get(roomId);
  if (room && room.participants.length === 0) {
    rooms.delete(roomId);
    console.log(`Room ${roomId} disposed`);
  }
};

// Function to validate room ID format
const isValidRoomId = (roomId) => {
  // Room IDs should be 7 characters long and contain only alphanumeric characters
  return /^[a-zA-Z0-9]{7}$/.test(roomId);
};

io.on('connection', (socket) => {
  const account = socket.handshake.query.account;
  console.log('User connected:', { socketId: socket.id, account });

  // Create a new room
  socket.on('createRoom', ({ account }) => {
    console.log('=== CREATE ROOM DEBUG ===');
    console.log('Creating room for account:', account);
    
    const roomId = generateRoomId();
    const room = {
      id: roomId,
      creator: account,
      participants: [{
        account,
        name: `User ${account.slice(0, 6)}...${account.slice(-4)}`,
        isOnline: true,
        isOwner: true
      }],
      gameStarted: false,
      status: 'waiting'
    };
    
    rooms.set(roomId, room);
    socket.join(roomId);
    
    // Only emit to the creator's socket
    console.log('Emitting roomCreated to creator:', { socketId: socket.id, account });
    socket.emit('roomCreated', { 
      roomId, 
      room: {
        ...room,
        view: 'owner'
      }
    });
  });

  // Join an existing room
  socket.on('joinRoom', ({ roomId, account }) => {
    console.log('=== JOIN ROOM DEBUG ===');
    console.log('Join request:', { socketId: socket.id, account, roomId });
    console.log('Available rooms:', Array.from(rooms.keys()));
    
    const room = rooms.get(roomId);
    if (!room) {
      console.log('Room not found:', roomId);
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.status !== 'waiting') {
      console.log('Room not in waiting state:', room.status);
      socket.emit('error', { message: 'Room is not available' });
      return;
    }

    if (room.gameStarted) {
      console.log('Game already started');
      socket.emit('error', { message: 'Game has already started' });
      return;
    }

    // Check if participant is already in room
    const existingParticipant = room.participants.find(p => p.account === account);
    if (existingParticipant) {
      console.log('Participant already in room:', { account, roomId });
      socket.emit('error', { message: 'You are already in this room' });
      return;
    }

    // Add new participant
    const newParticipant = {
      account,
      name: `User ${account.slice(0, 6)}...${account.slice(-4)}`,
      isOnline: true,
      isOwner: false
    };
    
    room.participants.push(newParticipant);
    rooms.set(roomId, room);
    
    // Join the socket room
    socket.join(roomId);
    
    // First emit roomJoined to the new participant only
    const joinerRoom = {
      ...room,
      view: 'joiner'
    };
    console.log('Emitting roomJoined to joiner:', { socketId: socket.id, account });
    socket.emit('roomJoined', { room: joinerRoom });
    
    // Then emit participantJoined to other room participants
    const ownerRoom = {
      ...room,
      view: 'owner'
    };
    console.log('Emitting participantJoined to room:', roomId);
    socket.to(roomId).emit('participantJoined', { room: ownerRoom });
  });

  // Signal that a participant is ready
  socket.on('participantReady', ({ roomId, account }) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const participant = room.participants.find(p => p.account === account);
    if (participant) {
      participant.isReady = true;
      rooms.set(roomId, room);
      
      // Check if all participants are ready
      const allReady = room.participants.every(p => p.isReady);
      if (allReady) {
        room.isReady = true;
        rooms.set(roomId, room);
        io.to(roomId).emit('roomReady', { room });
      } else {
        io.to(roomId).emit('participantUpdated', { room });
      }
    }
  });

  // Update participant name
  socket.on('updateName', ({ roomId, account, newName }) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const participant = room.participants.find(p => p.account === account);
    if (participant) {
      participant.name = newName;
      rooms.set(roomId, room);
      
      // Emit to all participants with their respective views
      io.to(roomId).emit('participantUpdated', { 
        room: {
          ...room,
          view: room.creator === socket.id ? 'owner' : 'joiner'
        }
      });
      
      console.log(`Name updated for ${account} to ${newName} in room ${roomId}`);
    } else {
      socket.emit('error', { message: 'Participant not found' });
    }
  });

  // Start game
  socket.on('startGame', (data) => {
    const { roomId, account } = data;
    const room = rooms.get(roomId);

    if (room && room.creator === account && room.participants.length >= 2) {
      room.gameStarted = true;
      rooms.set(roomId, room);
      io.to(roomId).emit('gameStarted', { room });
    }
  });

  // Leave room
  socket.on('leaveRoom', (data) => {
    const { roomId, account } = data;
    const room = rooms.get(roomId);

    if (room) {
      room.participants = room.participants.filter(p => p.account !== account);
      rooms.set(roomId, room);
      
      socket.leave(roomId);
      
      // Emit to remaining participants with their respective views
      io.to(roomId).emit('participantLeft', { 
        account, 
        room: {
          ...room,
          view: room.creator === socket.id ? 'owner' : 'joiner'
        }
      });

      // Check if room is empty and dispose if needed
      if (room.participants.length === 0) {
        disposeRoom(roomId);
      }
    }
  });

  // Get room info
  socket.on('getRoomInfo', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      socket.emit('roomInfo', { room });
    } else {
      socket.emit('error', { message: 'Room not found' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', { socketId: socket.id, account });
    
    // Find and clean up any rooms this socket was in
    rooms.forEach((room, roomId) => {
      const participantIndex = room.participants.findIndex(p => p.account === account);
      if (participantIndex !== -1) {
        room.participants.splice(participantIndex, 1);
        
        if (room.participants.length === 0) {
          console.log('Disposing empty room:', roomId);
          rooms.delete(roomId);
        } else {
          console.log('Emitting participantLeft to room:', roomId);
          io.to(roomId).emit('participantLeft', { 
            account,
            room: {
              ...room,
              participants: room.participants
            }
          });
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 