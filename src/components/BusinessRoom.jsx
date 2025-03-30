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
  faPlay
} from '@fortawesome/free-solid-svg-icons'
import { ethers } from 'ethers'
import { callerABI } from '../contracts/caller'
import { keyframes } from '@emotion/react'
import { io } from 'socket.io-client'
import BusinessRoomCreation from './BusinessRoomCreation'
import BusinessRoomJoin from './BusinessRoomJoin'

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
    const newSocket = io('http://localhost:3000', {
      transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
      query: { account }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setIsConnected(true);
      toast({
        title: 'Connected',
        description: 'Successfully connected to server',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to server. Please check if the server is running.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        newSocket.connect();
      }
      toast({
        title: 'Disconnected',
        description: 'Lost connection to server. Attempting to reconnect...',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      toast({
        title: 'Reconnected',
        description: 'Successfully reconnected to server',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      toast({
        title: 'Reconnection Failed',
        description: 'Unable to reconnect to server. Please refresh the page.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection...');
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.disconnect();
      }
    };
  }, [account]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('=== SOCKET EVENT LISTENERS SETUP ===');
    console.log('Current account:', account);
    console.log('Current room state:', currentRoom);
    console.log('Current participants:', participants);

    socket.on('error', ({ message }) => {
      console.log('Received error:', message);
      setIsJoiningRoom(false);
      setIsCreatingRoom(false);
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
      console.log('Room data:', room);
      console.log('Room ID:', roomId);
      setCurrentRoom(room);
      setParticipants(room.participants || []);
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
      console.log('Room data:', room);
      setCurrentRoom(room);
      setParticipants(room.participants || []);
      setIsJoiningRoom(false);
      toast({
        title: 'Room Joined',
        description: 'Successfully joined the room',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    });

    socket.on('participantJoined', ({ room }) => {
      console.log('=== PARTICIPANT JOINED EVENT ===');
      console.log('Room data:', room);
      setCurrentRoom(room);
      setParticipants(room.participants || []);
      toast({
        title: 'New Participant',
        description: 'A new participant joined the room',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    });

    socket.on('roomUpdated', ({ room }) => {
      console.log('=== ROOM UPDATED EVENT ===');
      console.log('Room data:', room);
      console.log('Current room ID:', currentRoom?.id);
      console.log('Event room ID:', room.id);
      
      if (currentRoom?.id === room.id) {
        console.log('Updating room state for room update');
        setCurrentRoom(prev => ({
          ...prev,
          ...room,
          view: prev.view // Preserve the view type
        }));
        setParticipants(room.participants || []);
      }
    });

    socket.on('participantLeft', ({ room }) => {
      console.log('Participant Left:', room);
      setCurrentRoom(room);
      setParticipants(room.participants || []);
      toast({
        title: 'Participant Left',
        description: 'A participant left the room',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    });

    socket.on('participantUpdated', ({ room }) => {
      console.log('Participant updated:', room);
      if (currentRoom && currentRoom.id === room.id) {
        setCurrentRoom(room);
        setParticipants(room.participants);
        setEditingName(false);
        setNewName('');
      }
    });

    // Add debug logging for state changes
    console.log('Current Room State:', currentRoom);
    console.log('Current Participants:', participants);

    return () => {
      console.log('=== CLEANING UP SOCKET EVENT LISTENERS ===');
      if (socket) {
        socket.off('error');
        socket.off('roomCreated');
        socket.off('roomJoined');
        socket.off('participantJoined');
        socket.off('participantLeft');
        socket.off('roomUpdated');
        socket.off('gameStarted');
      }
    };
  }, [socket, isConnected, account, toast]);

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

  const renderDisclosureScreen = () => (
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
            Welcome to Acroswe Disclosure
          </Heading>

          <Box w="100%" p={6} bg="gray.700" borderRadius="lg">
            <VStack spacing={4}>
              <Text color="gray.400" fontSize="lg">Participants</Text>
              <List spacing={3} w="100%">
                {participants.map((participant) => (
                  <ListItem
                    key={`disclosure-${participant.account}`}
                    p={3}
                    bg="gray.800"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="blue.400"
                  >
                    <HStack justify="space-between">
                      <HStack spacing={3}>
                        <Box
                          w={3}
                          h={3}
                          borderRadius="full"
                          bg={participant.isOnline ? 'green.400' : 'red.400'}
                          boxShadow={`0 0 10px ${participant.isOnline ? 'rgba(72, 187, 120, 0.4)' : 'rgba(229, 62, 62, 0.4)'}`}
                        />
                        <Text fontSize={participantTextSize} color="white">
                          {participant.name}
                        </Text>
                      </HStack>
                      {participant.account === currentRoom.creator && (
                        <Badge colorScheme="blue" size={badgeSize}>
                          Creator
                        </Badge>
                      )}
                    </HStack>
                  </ListItem>
                ))}
              </List>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </Container>
  );

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
    currentRoom.gameStarted ? renderDisclosureScreen() : renderRoomInterface()
  ) : renderDefaultView();
}

export default BusinessRoom 