import React from 'react';
import {
  VStack,
  Button,
  Text,
  useToast,
  Box,
  Input,
  FormControl,
  FormLabel,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSignInAlt,
  faKey,
  faHashtag,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';

function BusinessRoomJoin({ account, onJoinRoom }) {
  const [roomId, setRoomId] = React.useState('');
  const [isJoiningRoom, setIsJoiningRoom] = React.useState(false);
  const toast = useToast();

  // Responsive values
  const iconSize = useBreakpointValue({ base: 'lg', md: '2x', lg: '3x' });
  const headingSize = useBreakpointValue({ base: 'lg', md: 'xl', lg: '2xl' });
  const textSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const inputSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const spacing = useBreakpointValue({ base: 4, md: 6, lg: 8 });

  const handleJoinRoom = async () => {
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

    try {
      setIsJoiningRoom(true);
      onJoinRoom(roomId.trim().toLowerCase());
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: 'Error',
        description: 'Failed to join room',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  return (
    <VStack spacing={spacing} align="center" w="100%">
      <Box textAlign="center">
        <FontAwesomeIcon 
          icon={faSignInAlt} 
          size={iconSize}
          color="#48BB78"
          style={{
            marginBottom: '1rem',
            animation: 'float 3s ease-in-out infinite',
          }}
        />
        <Text fontSize={headingSize} color="white" fontWeight="bold">
          Join an existing business room
        </Text>
        <Text fontSize={textSize} color="gray.400" mt={2}>
          Enter the room code to join an existing business room
        </Text>
      </Box>

      <FormControl w="100%" maxW="400px">
        <FormLabel color="white" fontSize={textSize}>
          <FontAwesomeIcon icon={faKey} style={{ marginRight: '0.5rem' }} />
          Room Code
        </FormLabel>
        <Box position="relative">
          <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400">
            <FontAwesomeIcon icon={faHashtag} />
          </Box>
          <Input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter room code"
            size={inputSize}
            bg="gray.700"
            borderColor="gray.600"
            _hover={{ borderColor: 'green.400' }}
            _focus={{ borderColor: 'green.400' }}
            textTransform="uppercase"
            letterSpacing="0.1em"
            pl={10}
          />
        </Box>
      </FormControl>
      
      <Button
        colorScheme="green"
        size={buttonSize}
        onClick={handleJoinRoom}
        isLoading={isJoiningRoom}
        leftIcon={<FontAwesomeIcon icon={faArrowRight} />}
        w="100%"
        maxW="400px"
        boxShadow="0 0 15px rgba(72, 187, 120, 0.4)"
        transform="scale(1.05)"
        transition="all 0.2s"
      >
        Join Room
      </Button>
    </VStack>
  );
}

export default BusinessRoomJoin; 