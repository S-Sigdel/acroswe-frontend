import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Divider,
  Heading,
  useBreakpointValue,
  Stack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  Badge,
  Link,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faBuilding,
  faPlus,
  faSignInAlt,
  faArrowRight,
  faUsers,
  faDoorOpen,
  faCopy,
  faPlay,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons'
import { ethers } from 'ethers'
import { callerABI } from '../contracts/caller'
import { keyframes } from '@emotion/react'
import { io } from 'socket.io-client'
import BusinessRoomCreation from './BusinessRoomCreation'
import BusinessRoomJoin from './BusinessRoomJoin'
import HouseParametersForm from './HouseParametersForm'

// Define glow animation
const glowKeyframes = keyframes`
  0% { box-shadow: 0 0 10px rgba(66, 153, 225, 0.2); }
  50% { box-shadow: 0 0 20px rgba(66, 153, 225, 0.4); }
  100% { box-shadow: 0 0 10px rgba(66, 153, 225, 0.2); }
`

const buttonGlow = keyframes`
  0% { box-shadow: 0 0 5px currentColor; }
  50% { box-shadow: 0 0 15px currentColor; }
  100% { box-shadow: 0 0 5px currentColor; }
`

const CALLER_CONTRACT_ADDRESS = "YOUR_CALLER_CONTRACT_ADDRESS"

// Contract ABI - Add just the deposit function ABI
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS"; // Replace with your actual contract address

const TOKEN_ADDRESS = "0x8D4124Fc1c34DDD7351444567A02BD8526fBe561";
const VAULT_ADDRESS = "0x0a317E681e4D9d2484ecCaA620c352d65Aa2C603";

const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

function BusinessRoom({ account }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [depositAmount, setDepositAmount] = useState('')
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false)
  const toast = useToast()
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [currentName, setCurrentName] = useState('')
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [consensusReached, setConsensusReached] = useState(false);
  const [consensusPrice, setConsensusPrice] = useState(null);
  const [consensusNFT, setConsensusNFT] = useState(null);

  // All responsive values at the top level
  const containerPadding = useBreakpointValue({ base: 4, md: 8 })
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' })
  const headingSize = useBreakpointValue({ base: 'md', md: 'lg' })
  const stackSpacing = useBreakpointValue({ base: 4, md: 8 })
  const boxWidth = useBreakpointValue({ base: '100%', md: '80%', lg: '60%' })
  const iconSize = useBreakpointValue({ base: 'lg', md: '2x', lg: '2x' })
  const tabSize = useBreakpointValue({ base: 'sm', md: 'md', lg: 'lg' })
  const roomCodeSize = useBreakpointValue({ base: 'md', md: 'lg', lg: 'xl' })
  const participantTextSize = useBreakpointValue({ base: 'sm', md: 'md' })
  const badgeSize = useBreakpointValue({ base: 'sm', md: 'md' })

  // Initialize socket connection
  useEffect(() => {
    console.log('Initializing socket connection...');
    console.log('Account:', account);

    // Cleanup any existing socket
    if (socket) {
      console.log('Cleaning up existing socket...');
      socket.disconnect();
    }

    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      query: { account },
      forceNew: true
    });

    // Debug socket state
    newSocket.on('connecting', () => {
      console.log('Socket connecting...', {
        connected: newSocket.connected,
        disconnected: newSocket.disconnected,
        transport: newSocket.io?.engine?.transport?.name
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      console.error('Connection details:', {
        readyState: newSocket.io?.engine?.readyState,
        transport: newSocket.io?.engine?.transport?.name,
        protocol: newSocket.io?.engine?.protocol,
        error: error.message
      });

      setIsConnected(false);
      toast({
        title: 'Connection Error',
        description: `Failed to connect to server. Please refresh the page or try again later.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      console.log('Connection details:', {
        id: newSocket.id,
        transport: newSocket.io.engine.transport.name,
        protocol: newSocket.io.engine.protocol
      });

      setIsConnected(true);
      toast({
        title: 'Connected',
        description: 'Successfully connected to server',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      console.log('Disconnect details:', {
        wasConnected: newSocket.connected,
        reconnecting: newSocket.io?.reconnecting,
        attempts: newSocket.io?.reconnectionAttempts
      });

      setIsConnected(false);
      
      // Show different messages based on disconnect reason
      const messages = {
        'io server disconnect': 'Server disconnected. Please refresh the page.',
        'io client disconnect': 'Disconnected from server.',
        'transport close': 'Lost connection to server. Attempting to reconnect...',
        'ping timeout': 'Connection timed out. Attempting to reconnect...'
      };

      toast({
        title: 'Disconnected',
        description: messages[reason] || 'Lost connection to server. Attempting to reconnect...',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    });

    // Add reconnect event handlers
    newSocket.io.on('reconnect', (attempt) => {
      console.log('Reconnected on attempt:', attempt);
      toast({
        title: 'Reconnected',
        description: 'Successfully reconnected to server',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    });

    newSocket.io.on('reconnect_attempt', (attempt) => {
      console.log('Attempting to reconnect:', attempt);
    });

    newSocket.io.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    newSocket.io.on('reconnect_failed', () => {
      console.log('Failed to reconnect');
      toast({
        title: 'Connection Failed',
        description: 'Unable to reconnect to server. Please refresh the page.',
        status: 'error',
        duration: null,
        isClosable: true,
      });
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection...');
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [account]);

  // Add socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('error', ({ message }) => {
      console.log('=== ERROR EVENT ===');
      console.log('Error message:', message);
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    });

    socket.on('roomCreated', ({ roomId, room }) => {
      console.log('=== ROOM CREATED EVENT ===');
      console.log('Room ID:', roomId);
      console.log('Room:', room);
      setCurrentRoom(room);
      setParticipants(room.participants);
      setIsCreatingRoom(false);
      toast({
        title: 'Room Created',
        description: `Room Code: ${roomId.toUpperCase()}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    });

    socket.on('roomJoined', ({ room }) => {
      console.log('=== ROOM JOINED EVENT ===');
      console.log('Room:', room);
      setCurrentRoom(room);
      setParticipants(room.participants);
      setIsJoiningRoom(false);
      toast({
        title: 'Joined Room',
        description: `Room Code: ${room.id.toUpperCase()}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    });

    socket.on('participantJoined', ({ room }) => {
      console.log('=== PARTICIPANT JOINED EVENT ===');
      console.log('Room:', room);
      setCurrentRoom(room);
      setParticipants(room.participants);
      toast({
        title: 'New Participant',
        description: 'Someone joined the room',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    });

    socket.on('participantLeft', ({ account, room }) => {
      console.log('=== PARTICIPANT LEFT EVENT ===');
      console.log('Account:', account);
      console.log('Room:', room);
      setCurrentRoom(room);
      setParticipants(room.participants);
      toast({
        title: 'Participant Left',
        description: 'Someone left the room',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    });

    socket.on('predictionMade', ({ prediction, formData, account, predictions, hasConsensus }) => {
      console.log('=== PREDICTION MADE EVENT ===');
      console.log('Prediction:', prediction);
      console.log('Form Data:', formData);
      console.log('Account:', account);
      console.log('All Predictions:', predictions);
      console.log('Has Consensus:', hasConsensus);
      
      setCurrentPrediction(prediction);
      setPredictions(predictions);
      setConsensusReached(hasConsensus);
      
      toast({
        title: 'New Prediction',
        description: `Price: $${prediction.toLocaleString()}`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    });

    socket.on('consensusReached', ({ room, consensusPrice, nftDetails }) => {
      console.log('=== CONSENSUS REACHED EVENT ===');
      console.log('Consensus Price:', consensusPrice);
      console.log('NFT Details:', nftDetails);
      
      setCurrentRoom(room);
      setConsensusPrice(consensusPrice);
      setConsensusNFT(nftDetails);
      setConsensusReached(true);
      
      toast({
        title: 'Consensus Reached! 🎉',
        description: (
          <VStack spacing={2} align="start">
            <Text>Consensus Price: ${consensusPrice.toLocaleString()}</Text>
            <Text>NFT minted to owner!</Text>
            <Link
              href={nftDetails.blockExplorer}
              isExternal
              color="blue.400"
              textDecoration="underline"
            >
              View on Etherscan
            </Link>
          </VStack>
        ),
        status: 'success',
        duration: 10000,
        isClosable: true,
      });
    });

    socket.on('gameStarted', ({ room }) => {
      console.log('=== GAME STARTED EVENT ===');
      console.log('Room:', room);
      setCurrentRoom(room);
      toast({
        title: 'Disclosure Launched',
        description: 'The disclosure phase has started',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    });

    socket.on('propertyPurchased', ({ room, buyer, amount, depositTxHash, transferTxHash }) => {
      console.log('=== PROPERTY PURCHASED EVENT ===');
      console.log('Room:', room);
      console.log('Buyer:', buyer);
      console.log('Amount:', amount);
      console.log('Deposit Transaction:', depositTxHash);
      console.log('Transfer Transaction:', transferTxHash);
      
      setCurrentRoom(room);
      toast({
        title: 'Property Purchase Complete',
        description: `Purchase amount: ${amount} DOLLARS\nTransfer to owner successful!`,
        status: 'success',
        duration: 7000,
        isClosable: true,
      });
    });

    return () => {
      if (socket) {
        socket.off('error');
        socket.off('roomCreated');
        socket.off('roomJoined');
        socket.off('participantJoined');
        socket.off('participantLeft');
        socket.off('predictionMade');
        socket.off('gameStarted');
        socket.off('propertyPurchased');
        socket.off('consensusReached');
      }
    };
  }, [socket, isConnected, toast]);

  // Add a debug effect to monitor state changes
  useEffect(() => {
    console.log('=== STATE CHANGE DETECTED ===');
    console.log('Current Room:', currentRoom);
    console.log('Participants:', participants);
    console.log('Is Joining:', isJoiningRoom);
    console.log('Is Creating:', isCreatingRoom);
  }, [currentRoom, participants, isJoiningRoom, isCreatingRoom]);

  const handleCreateRoom = () => {
    if (!socket || !isConnected) {
      toast({
        title: 'Connection Error',
        description: 'Not connected to server. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsCreatingRoom(true);
    socket.emit('createRoom', { account });
  };

  const handleJoinRoom = (roomId) => {
    if (!socket || !isConnected) {
      toast({
        title: 'Connection Error',
        description: 'Not connected to server. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    console.log('=== HANDLING JOIN ROOM ===');
    console.log('Room ID:', roomId);
    console.log('Account:', account);
    
    if (!roomId || !roomId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a room code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsJoiningRoom(true);
    const trimmedRoomId = roomId.trim().toLowerCase();
    console.log('Emitting joinRoom event:', { roomId: trimmedRoomId, account });
    socket.emit('joinRoom', { roomId: trimmedRoomId, account });
  };

  const handleLeaveRoom = () => {
    if (!socket || !isConnected || !currentRoom) return;

    socket.emit('leaveRoom', { roomId: currentRoom.id, account });
    setCurrentRoom(null);
    setParticipants([]);
  };

  const copyRoomId = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.id.toUpperCase());
      toast({
        title: 'Copied',
        description: 'Room code copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleUpdateName = () => {
    if (newName.trim() && currentRoom) {
      socket.emit('updateName', {
        roomId: currentRoom.id,
        account,
        newName: newName.trim()
      });
      // Don't update the state here - wait for the server response
    }
  };

  const handleStartGame = () => {
    if (currentRoom && currentRoom.creator === account) {
      socket.emit('startGame', {
        roomId: currentRoom.id,
        account
      });
    }
  };

  const handleBuyProperty = async () => {
    if (!currentPrediction) {
      toast({
        title: 'Error',
        description: 'No prediction available',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsDepositing(true);

      // Get the provider and signer using ethers v6 syntax
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Initialize token contract
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      
      // Convert prediction to token amount (18 decimals)
      const amount = ethers.parseUnits(currentPrediction.toString(), 18);
      
      // Check token balance
      const balance = await tokenContract.balanceOf(account);
      if (balance < amount) {
        throw new Error('Insufficient DOLLARS balance');
      }
      
      // Check and set allowance if needed
      const allowance = await tokenContract.allowance(account, VAULT_ADDRESS);
      if (allowance < amount) {
        console.log('Approving vault to spend tokens...');
        const approveTx = await tokenContract.approve(VAULT_ADDRESS, amount);
        await approveTx.wait();
        console.log('Approval successful');
      }
      
      // Deposit tokens to vault
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, ["function depositTokens(uint256 amount)"], signer);
      console.log('Depositing tokens to vault...');
      const tx = await vaultContract.depositTokens(amount);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Deposit successful:', receipt.hash);

      // Notify server of successful deposit
      socket.emit('buyProperty', {
        roomId: currentRoom.id,
        account,
        prediction: currentPrediction,
        transactionHash: receipt.hash
      });

      toast({
        title: 'Deposit Successful',
        description: 'DOLLARS tokens deposited to vault. Waiting for transfer to owner...',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error in property purchase:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to purchase property',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const renderParticipantName = (participant) => {
    if (!participant || !participant.account) {
      return null;
    }

    if (editingName && participant.account === account) {
      return (
        <HStack>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            size="sm"
            placeholder="Enter your name"
            bg="gray.800"
            borderColor="blue.400"
            _focus={{ borderColor: 'blue.300' }}
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleUpdateName();
              }
            }}
          />
          <Button
            size="sm"
            colorScheme="blue"
            onClick={handleUpdateName}
            isLoading={false}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditingName(false);
              setNewName('');
            }}
          >
            Cancel
          </Button>
        </HStack>
      );
    }

    return (
      <HStack spacing={2}>
        <Text fontSize={participantTextSize} color="white">
          {participant.name || `User ${participant.account.slice(0, 6)}...${participant.account.slice(-4)}`}
              </Text>
        {participant.account === account && (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              setNewName(participant.name || '');
              setEditingName(true);
            }}
            colorScheme="blue"
            _hover={{
              bg: 'blue.500',
              color: 'white',
              transform: 'scale(1.05)',
              boxShadow: '0 0 10px rgba(66, 153, 225, 0.4)'
            }}
          >
            Edit
          </Button>
        )}
            </HStack>
    );
  };

  const renderPredictionStats = () => {
    if (!predictions || predictions.length === 0) return null;

    const avgPrediction = predictions.reduce((sum, p) => sum + p.prediction, 0) / predictions.length;
    const minPrediction = Math.min(...predictions.map(p => p.prediction));
    const maxPrediction = Math.max(...predictions.map(p => p.prediction));

    return (
      <Box
        w="100%"
        p={4}
        bg="gray.700"
        borderRadius="lg"
        border="1px solid"
        borderColor="blue.400"
      >
        <VStack spacing={3}>
          <Text color="blue.400" fontSize="lg" fontWeight="bold">
            Prediction Statistics
          </Text>
          <SimpleGrid columns={3} spacing={4} w="100%">
            <Stat>
              <StatLabel color="gray.400">Average</StatLabel>
              <StatNumber color="white">${avgPrediction.toLocaleString()}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel color="gray.400">Minimum</StatLabel>
              <StatNumber color="white">${minPrediction.toLocaleString()}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel color="gray.400">Maximum</StatLabel>
              <StatNumber color="white">${maxPrediction.toLocaleString()}</StatNumber>
            </Stat>
          </SimpleGrid>
          <Text color="gray.400" fontSize="sm">
            {predictions.length} prediction{predictions.length !== 1 ? 's' : ''} submitted
          </Text>
          {!consensusReached && (
            <Text color="yellow.400" fontSize="sm">
              Waiting for consensus (within 10% range)...
            </Text>
          )}
        </VStack>
    </Box>
    );
  };

  const renderConsensusInfo = () => {
    if (!consensusReached || !consensusPrice || !consensusNFT) return null;

    return (
      <Box
        w="100%"
        p={6}
        bg="green.800"
        borderRadius="lg"
        border="2px solid"
        borderColor="green.400"
        boxShadow="0 0 20px rgba(72, 187, 120, 0.2)"
      >
        <VStack spacing={4}>
          <Heading size="md" color="green.400">
            Consensus Reached! 🎉
          </Heading>
          <Text color="white" fontSize="2xl" fontWeight="bold">
            ${consensusPrice.toLocaleString()}
          </Text>
          <VStack spacing={2}>
            <Text color="green.200">
              NFT minted to room owner
            </Text>
            <Link
              href={consensusNFT.blockExplorer}
              isExternal
              color="blue.400"
              textDecoration="underline"
            >
              View on Etherscan <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginLeft: '2px' }} />
            </Link>
          </VStack>
        </VStack>
      </Box>
    );
  };

  const renderRoomInterface = () => {
    console.log('Rendering Room Interface with participants:', participants);
    const isOwner = currentRoom.creator === account;

  return (
      <Container maxW="container.xl" py={containerPadding}>
          <Box 
            p={8} 
          borderRadius="2xl"
          bg="gray.800"
          borderColor="blue.400"
          border="2px solid"
          mx="auto"
          w={boxWidth}
          css={{
            boxShadow: '0 0 20px rgba(66, 153, 225, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <VStack spacing={8}>
            <HStack spacing={4} w="100%" justify="space-between">
              <Heading size={headingSize} color="blue.400">
                <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '0.5rem' }} />
                {isOwner ? 'Your Business Room' : 'Business Room'}
              </Heading>
              <Button
                colorScheme="red"
                size={buttonSize}
                onClick={handleLeaveRoom}
                leftIcon={<FontAwesomeIcon icon={faDoorOpen} />}
                bg="red.500"
                color="white"
                boxShadow="0 0 15px rgba(229, 62, 62, 0.4)"
                transform="scale(1.05)"
                transition="all 0.2s"
              >
                Leave Room
              </Button>
            </HStack>

            {/* Show room code for both owner and joiner */}
            <Box
              w="100%"
              p={4}
              bg="gray.700"
              borderRadius="lg"
              border="1px solid"
              borderColor="blue.400"
              _hover={{
                borderColor: 'blue.300',
                boxShadow: '0 0 10px rgba(66, 153, 225, 0.2)',
                transition: 'all 0.2s'
              }}
            >
              <VStack spacing={2} align="start">
                <Text color="gray.400" fontSize="sm">Room Code</Text>
                <HStack justify="space-between" w="100%">
                  <Text
                    fontFamily="mono"
                    fontSize={roomCodeSize}
                    color="blue.400"
                    letterSpacing="0.2em"
                    fontWeight="bold"
                    textTransform="uppercase"
            bg="gray.800" 
                    px={3}
                    py={1}
                    borderRadius="md"
            border="1px solid"
                    borderColor="blue.500"
                    boxShadow="0 0 10px rgba(66, 153, 225, 0.2)"
          >
                    {currentRoom.id.toUpperCase()}
                  </Text>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyRoomId}
                    leftIcon={<FontAwesomeIcon icon={faCopy} />}
                    bg="blue.500"
                    color="white"
                    transform="scale(1.05)"
                    transition="all 0.2s"
                    boxShadow="0 0 10px rgba(66, 153, 225, 0.4)"
                  >
                    Copy
                </Button>
                </HStack>
              </VStack>
            </Box>

            <Divider />

            <VStack align="start" w="100%" spacing={4}>
              <HStack spacing={2}>
                <FontAwesomeIcon icon={faUsers} color="#4299E1" />
                <Text color="blue.400" fontSize={participantTextSize} fontWeight="medium">
                  Room Participants ({participants.length})
                </Text>
              </HStack>
              <List spacing={3} w="100%">
                {participants && participants.length > 0 ? (
                  participants.map((participant) => (
                    <ListItem
                      key={`room-${participant.account}`}
                      p={3}
                      bg="gray.700"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="blue.400"
                      _hover={{
                        borderColor: 'blue.300',
                        boxShadow: '0 0 10px rgba(66, 153, 225, 0.2)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <VStack align="start" spacing={2}>
                        <HStack justify="space-between" w="100%">
                          <HStack spacing={3}>
                            <Box
                              w={3}
                              h={3}
                              borderRadius="full"
                              bg={participant.isOnline ? 'green.400' : 'red.400'}
                              boxShadow={`0 0 10px ${participant.isOnline ? 'rgba(72, 187, 120, 0.4)' : 'rgba(229, 62, 62, 0.4)'}`}
                            />
                            {renderParticipantName(participant)}
                          </HStack>
                          {participant.account === currentRoom.creator && (
                            <Badge colorScheme="blue" size={badgeSize}>
                              Creator
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                    </ListItem>
                  ))
                ) : (
                  <ListItem
                    p={3}
                    bg="gray.700"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="blue.400"
                  >
                    <Text color="gray.400">No participants yet</Text>
                  </ListItem>
                )}
              </List>

              {participants.length >= 2 && !currentRoom.gameStarted && (
                <>
                  <HouseParametersForm 
                    onSubmit={(prediction) => {
                      setCurrentPrediction(prediction);
                    }}
                    socket={socket}
                    roomId={currentRoom.id}
                    account={account}
                    disabled={consensusReached}
                  />

                  {renderPredictionStats()}
                  {renderConsensusInfo()}

                  {currentPrediction !== null && (
                    <Box
                      w="100%"
                      p={4}
                      bg="gray.700"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="green.400"
                      _hover={{
                        borderColor: 'green.300',
                        boxShadow: '0 0 10px rgba(72, 187, 120, 0.2)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <VStack spacing={2}>
                        <Text color="green.400" fontSize="lg" fontWeight="bold">
                          Current Prediction
                        </Text>
                        <Text color="white" fontSize="2xl">
                          ${currentPrediction.toLocaleString()}
                        </Text>
                      </VStack>
                    </Box>
                  )}
                </>
              )}

              {isOwner && participants.length >= 2 && !currentRoom.gameStarted && (
                <Button
                  colorScheme="green"
                  size="lg"
                  w="100%"
                  onClick={handleStartGame}
                  leftIcon={<FontAwesomeIcon icon={faPlay} />}
                  boxShadow="0 0 15px rgba(72, 187, 120, 0.4)"
                  transform="scale(1.05)"
                  transition="all 0.2s"
                >
                  Launch Disclosure
                </Button>
              )}
            </VStack>
          </VStack>
        </Box>
      </Container>
    );
  };

  const renderGameInterface = () => {
    const isOwner = currentRoom.creator === account;
    const isBuyer = currentRoom.buyer === account;
    const isPurchased = currentRoom.propertyPurchased;

    // Convert prediction to DOLLARS (handle the case where currentPrediction is null)
    const getTokenAmount = () => {
      try {
        if (!currentPrediction) return "0";
        
        // Convert scientific notation to a regular number first
        const normalizedValue = Number(currentPrediction).toLocaleString('fullwide', { useGrouping: false });
        
        // Round to a reasonable number (e.g., 6 decimal places) to avoid extremely large values
        const roundedValue = Math.round(parseFloat(normalizedValue) * 1e6) / 1e6;
        
        // Convert to token amount with 18 decimals
        const tokenAmount = ethers.parseUnits(roundedValue.toString(), 18);
        return ethers.formatUnits(tokenAmount, 18);
      } catch (error) {
        console.error('Error converting prediction to DOLLARS:', error);
        return "0";
      }
    };

    return (
      <Container maxW="container.xl" py={containerPadding}>
        <Box
          p={8}
          borderRadius="2xl"
          bg="gray.800"
          borderColor="blue.400"
          border="2px solid"
          mx="auto"
          w={boxWidth}
          css={{
            boxShadow: '0 0 20px rgba(66, 153, 225, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <VStack spacing={8}>
            <Heading size={headingSize} color="blue.400" textAlign="center">
              Property Disclosure Phase
            </Heading>

            {currentPrediction !== null && (
              <Box
                w="100%"
                p={4}
                bg="gray.700"
                borderRadius="lg"
                border="1px solid"
                borderColor="green.400"
                _hover={{
                  borderColor: 'green.300',
                  boxShadow: '0 0 10px rgba(72, 187, 120, 0.2)',
                  transition: 'all 0.2s'
                }}
              >
                <VStack spacing={2}>
                  <Text color="green.400" fontSize="lg" fontWeight="bold">
                    Required Deposit
                  </Text>
                  <Text color="white" fontSize="2xl">
                    ${currentPrediction.toLocaleString()}
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    ({getTokenAmount()} DOLLARS)
                  </Text>
                </VStack>
              </Box>
            )}

            {isPurchased ? (
              <Box p={4} borderRadius="md" bg={useColorModeValue('gray.100', 'gray.700')}>
                <Heading size="md" mb={2}>
                  {isOwner ? "Property Sold!" : isBuyer ? "Property Purchased!" : "Property Sale Complete"}
                </Heading>
                <Text>
                  {isOwner ? (
                    `You sold this property for ${currentPrediction} DOLLARS`
                  ) : isBuyer ? (
                    `You purchased this property for ${currentPrediction} DOLLARS`
                  ) : (
                    `This property was purchased for ${currentPrediction} DOLLARS`
                  )}
                </Text>
                {(isOwner || isBuyer) && (
                  <Text mt={2} fontSize="sm" color="gray.500">
                    Transaction Hash: {currentRoom.transferTxHash}
                  </Text>
                )}
              </Box>
            ) : (
                  <Button
                    colorScheme="green"
                    size="lg"
                    w="100%"
                onClick={handleBuyProperty}
                isLoading={isDepositing}
                loadingText="Depositing..."
                leftIcon={<FontAwesomeIcon icon={faPlay} />}
                boxShadow="0 0 15px rgba(72, 187, 120, 0.4)"
                transform="scale(1.05)"
                transition="all 0.2s"
              >
                Deposit DOLLARS & Buy Property
                  </Button>
            )}
                </VStack>
        </Box>
      </Container>
    );
  };

  const renderLoadingScreen = () => (
    <Container maxW="container.xl" py={containerPadding}>
      <Box
        p={8}
        borderRadius="2xl"
        bg="gray.800"
        borderColor="blue.400"
        border="2px solid"
        mx="auto"
        w={boxWidth}
        css={{
          boxShadow: '0 0 20px rgba(66, 153, 225, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <VStack spacing={8}>
          <Heading size={headingSize} color="blue.400" textAlign="center">
            Connecting to Room...
          </Heading>
          <Text color="gray.400" textAlign="center">
            Please wait while we connect all participants
          </Text>
            </VStack>
          </Box>
    </Container>
  );

  const renderDefaultView = () => (
    <Container maxW="container.xl" py={containerPadding}>
          <Box 
            p={8} 
        borderRadius="2xl"
            bg="gray.800" 
        borderColor="blue.400"
        border="2px solid"
        css={{ 
          animation: `${glowKeyframes} 3s infinite`,
          backdropFilter: 'blur(10px)',
        }}
        mx="auto"
        w={boxWidth}
      >
        <VStack spacing={stackSpacing}>
          <HStack spacing={4}>
            <FontAwesomeIcon 
              icon={faBuilding} 
              size={iconSize}
              color="#4299E1"
            />
            <Heading size={headingSize} color="blue.400" textAlign="center">
              Business Room
            </Heading>
          </HStack>

          <Tabs 
            variant="soft-rounded" 
            colorScheme="blue" 
            w="100%"
            onChange={(index) => setActiveTab(index)}
            size={tabSize}
          >
            <TabList justifyContent="center" gap={4} flexWrap="wrap">
              <Tab 
                _selected={{ 
                  color: 'white', 
                  bg: 'blue.500',
                  boxShadow: '0 0 10px rgba(66, 153, 225, 0.4)',
                  transform: 'scale(1.05)',
                  transition: 'all 0.2s'
                }}
                _hover={{
                  transform: 'scale(1.02)',
                  transition: 'all 0.2s'
                }}
              >
                <FontAwesomeIcon icon={faPlus} style={{ marginRight: '0.5rem' }} />
                Create Room
              </Tab>
              <Tab 
                _selected={{ 
                  color: 'white', 
                  bg: 'green.500',
                  boxShadow: '0 0 10px rgba(72, 187, 120, 0.4)',
                  transform: 'scale(1.05)',
                  transition: 'all 0.2s'
                }}
                _hover={{
                  transform: 'scale(1.02)',
                  transition: 'all 0.2s'
                }}
              >
                <FontAwesomeIcon icon={faSignInAlt} style={{ marginRight: '0.5rem' }} />
                Join Room
              </Tab>
            </TabList>

            <TabPanels mt={8}>
              <TabPanel px={0}>
                <BusinessRoomCreation 
                  account={account} 
                  onCreateRoom={handleCreateRoom}
                />
              </TabPanel>
              <TabPanel px={0}>
                <BusinessRoomJoin 
                  account={account}
                  onJoinRoom={handleJoinRoom}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
            </VStack>
          </Box>
    </Container>
  );

  return currentRoom ? (
    currentRoom.gameStarted ? renderGameInterface() : renderRoomInterface()
  ) : renderDefaultView();
}

export default BusinessRoom 