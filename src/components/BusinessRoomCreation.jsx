import React from 'react';
import {
  VStack,
  Button,
  Text,
  useToast,
  Box,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus,
  faPlusCircle,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { ethers } from 'ethers';
import { callerABI } from '../contracts/caller';

const CALLER_CONTRACT_ADDRESS = "YOUR_CALLER_CONTRACT_ADDRESS";

function BusinessRoomCreation({ account }) {
  const [isCreatingRoom, setIsCreatingRoom] = React.useState(false);
  const toast = useToast();

  // Responsive values
  const iconSize = useBreakpointValue({ base: 'lg', md: '2x', lg: '3x' });
  const headingSize = useBreakpointValue({ base: 'lg', md: 'xl', lg: '2xl' });
  const textSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const spacing = useBreakpointValue({ base: 4, md: 6, lg: 8 });

  const createRoom = async () => {
    try {
      setIsCreatingRoom(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CALLER_CONTRACT_ADDRESS, callerABI, signer);

      const tx = await contract.createRoom();
      await tx.wait();

      toast({
        title: 'Success',
        description: 'Room created successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to create room',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <VStack spacing={spacing} align="center" w="100%">
      <Box textAlign="center">
        <FontAwesomeIcon 
          icon={faPlusCircle} 
          size={iconSize}
          color="#4299E1"
          style={{
            marginBottom: '1rem',
            animation: 'float 3s ease-in-out infinite',
          }}
        />
        <Text fontSize={headingSize} color="white" fontWeight="bold">
          Create a new business room
        </Text>
        <Text fontSize={textSize} color="gray.400" mt={2}>
          Start a new business room to collaborate with others
        </Text>
      </Box>
      
      <Button
        colorScheme="blue"
        size={buttonSize}
        onClick={createRoom}
        isLoading={isCreatingRoom}
        loadingText="Creating Room..."
        px={8}
        _hover={{
          transform: 'scale(1.05)',
          transition: 'all 0.2s',
          boxShadow: '0 0 15px rgba(66, 153, 225, 0.4)'
        }}
      >
        <FontAwesomeIcon icon={faPlus} style={{ marginRight: '0.5rem' }} />
        Create Room
        <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: '0.5rem' }} />
      </Button>
    </VStack>
  );
}

export default BusinessRoomCreation; 