import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const VERBWIRE_API_KEY = process.env.VITE_VERBWIRE_API_KEY;
const VERBWIRE_API_URL = 'https://api.verbwire.com/v1';

const VAULT_ABI = [
  "function transferTokens(address token, address to, uint256 amount)",
  "function getTokenBalance(address token) view returns (uint256)"
];

const TOKEN_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

const VAULT_ADDRESS = '0x0a317E681e4D9d2484ecCaA620c352d65Aa2C603';
const TOKEN_ADDRESS = '0x8D4124Fc1c34DDD7351444567A02BD8526fBe561';

const app = express();

// More permissive CORS configuration
app.use(cors({
  origin: true, // Allow all origins
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const httpServer = createServer(app);

// Updated Socket.IO configuration
const io = new Server(httpServer, {
  cors: {
    origin: true, // Allow all origins
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8
});

// Debug middleware for Socket.IO
io.engine.on("connection_error", (err) => {
  console.log('=== CONNECTION ERROR ===');
  console.log(err.code);     // the error code
  console.log(err.message);  // the error message
  console.log(err.context);  // some additional error context
});

// Add detailed logging for transport changes
io.engine.on("transport", (transport) => {
  console.log('=== TRANSPORT CHANGE ===');
  console.log('New transport:', transport.name);
  console.log('Previous transport:', transport.previousTransport ? transport.previousTransport.name : 'none');
});

// Add a basic route to check if server is running
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount
  });
});

// Store room data
const rooms = new Map();

// Store participant sockets
const participantSockets = new Map();

// Function to generate a random room ID
const generateRoomId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result.toLowerCase();
};

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

// Function to check if predictions have reached consensus
const checkConsensus = (predictions) => {
  if (!predictions || predictions.length < 2) return null;
  
  // Sort predictions by value
  const sortedPredictions = [...predictions].sort((a, b) => a.prediction - b.prediction);
  
  // Calculate median
  const median = sortedPredictions[Math.floor(predictions.length / 2)].prediction;
  
  // Check if all predictions are within 10% of median
  const threshold = median * 0.1; // 10% threshold
  const hasConsensus = sortedPredictions.every(p => 
    Math.abs(p.prediction - median) <= threshold
  );
  
  return hasConsensus ? median : null;
};

// Function to mint consensus NFT
const mintConsensusNFT = async (room, consensusPrice) => {
  try {
    const metadata = {
      name: `Property Consensus #${room.id}`,
      description: `Consensus price reached for property in room ${room.id}`,
      attributes: [
        {
          trait_type: "Consensus Price",
          value: consensusPrice.toString()
        },
        {
          trait_type: "Room ID",
          value: room.id
        },
        {
          trait_type: "Participants",
          value: room.participants.length.toString()
        },
        {
          trait_type: "Timestamp",
          value: Date.now().toString()
        }
      ]
    };

    // Mint NFT using Verbwire
    const response = await axios.post(
      `${VERBWIRE_API_URL}/nft/mint/quickMintFromMetadataUrl`,
      {
        allowPlatformToOperateToken: 'true',
        chain: 'sepolia',
        metadataUrl: JSON.stringify(metadata),
        recipientAddress: room.creator
      },
      {
        headers: {
          'X-API-Key': VERBWIRE_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.quick_mint;
  } catch (error) {
    console.error('Error minting consensus NFT:', error);
    return null;
  }
};

io.on('connection', (socket) => {
  const account = socket.handshake.query.account;
  console.log('User connected:', { socketId: socket.id, account });
  
  // Store the socket for this participant
  participantSockets.set(account, socket);

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
      status: 'waiting',
      lastPrediction: null
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

  // Handle game start
  socket.on('startGame', ({ roomId, account }) => {
    console.log('=== START GAME EVENT ===');
    console.log('Room ID:', roomId);
    console.log('Account:', account);

    const room = rooms.get(roomId);
    if (!room) {
      console.log('Room not found for game start');
      return;
    }

    if (room.creator !== account) {
      console.log('Only creator can start the game');
      return;
    }

    // Update room state
    room.gameStarted = true;

    // Notify all participants
    room.participants.forEach(participant => {
      const participantSocket = participantSockets.get(participant.account);
      if (participantSocket) {
        participantSocket.emit('gameStarted', { room });
      }
    });
  });

  // Handle property purchase
  socket.on('buyProperty', async ({ roomId, account, prediction, transactionHash }) => {
    console.log('=== HANDLING PROPERTY PURCHASE ===');
    console.log('Room ID:', roomId);
    console.log('Account:', account);
    console.log('Prediction:', prediction);
    console.log('Transaction Hash:', transactionHash);

    try {
      const room = rooms.get(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Get the room owner's address
      const ownerAddress = room.creator;
      console.log('Owner address:', ownerAddress);

      // Initialize provider and wallet
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const wallet = new ethers.Wallet(process.env.VAULT_PRIVATE_KEY, provider);
      console.log('Wallet address:', wallet.address);

      // Initialize vault contract
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);
      console.log('Vault contract initialized');

      // Convert prediction to token amount (18 decimals)
      const amount = ethers.parseUnits(prediction.toString(), 18);
      console.log('Amount to transfer:', amount.toString());

      // Check vault balance (no parameter needed)
      const vaultBalance = await vaultContract.getTokenBalance();
      console.log('Vault balance:', vaultBalance.toString());
      
      if (vaultBalance < amount) {
        throw new Error('Insufficient tokens in vault');
      }

      // Use withdrawTokens instead of transferTokens
      console.log('Initiating withdrawal from vault to owner...');
      const transferTx = await vaultContract.withdrawTokens(
        ownerAddress,  // recipient
        amount        // amount
      );
      console.log('Transfer transaction sent:', transferTx.hash);

      // Wait for transaction confirmation
      const transferReceipt = await transferTx.wait();
      console.log('Transfer confirmed:', transferReceipt.hash);

      // Update room state
      room.propertyPurchased = true;
      room.buyer = account;
      rooms.set(roomId, room);

      // Notify all participants
      io.to(roomId).emit('propertyPurchased', {
        room,
        buyer: account,
        amount: prediction,
        depositTxHash: transactionHash,
        transferTxHash: transferReceipt.hash
      });

    } catch (error) {
      console.error('Error in property purchase:', error);
      socket.emit('error', { message: `Failed to transfer tokens from vault to owner: ${error.message}` });
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
    
    // Remove the socket from participantSockets
    participantSockets.delete(account);
    
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

  // Handle prediction events
  socket.on('predictionMade', async ({ roomId, account, prediction, formData }) => {
    console.log('=== PREDICTION MADE EVENT ===');
    console.log('Room ID:', roomId);
    console.log('Account:', account);
    console.log('Prediction:', prediction);
    console.log('Form Data:', formData);

    const room = rooms.get(roomId);
    if (!room) {
      console.log('Room not found for prediction');
      return;
    }

    // Initialize predictions array if it doesn't exist
    if (!room.predictions) {
      room.predictions = [];
    }

    // Add or update prediction
    const existingPredictionIndex = room.predictions.findIndex(p => p.account === account);
    if (existingPredictionIndex !== -1) {
      room.predictions[existingPredictionIndex] = { account, prediction, formData };
    } else {
      room.predictions.push({ account, prediction, formData });
    }

    // Check for consensus
    const consensusPrice = checkConsensus(room.predictions);
    if (consensusPrice !== null) {
      console.log('=== CONSENSUS REACHED ===');
      console.log('Consensus Price:', consensusPrice);
      
      // Mint consensus NFT
      const mintResult = await mintConsensusNFT(room, consensusPrice);
      
      if (mintResult) {
        // Update room state
        room.consensusReached = true;
        room.consensusPrice = consensusPrice;
        room.consensusNFT = mintResult;
        
        // Notify all participants
        io.to(roomId).emit('consensusReached', {
          room,
          consensusPrice,
          nftDetails: mintResult
        });
      }
    }

    // Update room state
    room.lastPrediction = {
      prediction,
      formData,
      account,
      timestamp: Date.now()
    };
    rooms.set(roomId, room);

    // Emit to all participants in the room
    room.participants.forEach(participant => {
      const participantSocket = participantSockets.get(participant.account);
      if (participantSocket) {
        participantSocket.emit('predictionMade', {
          prediction,
          formData,
          account,
          predictions: room.predictions,
          hasConsensus: room.consensusReached
        });
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 