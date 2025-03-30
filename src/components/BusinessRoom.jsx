import React, { useState } from 'react'
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
} from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faBuilding,
  faPlus,
  faSignInAlt,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons'
import { ethers } from 'ethers'
import { callerABI } from '../contracts/caller'
import { keyframes } from '@emotion/react'
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
  const [activeTab, setActiveTab] = useState(0)
  const [roomId, setRoomId] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isJoiningRoom, setIsJoiningRoom] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const toast = useToast()

  // Responsive values
  const containerPadding = useBreakpointValue({ base: 4, md: 8 })
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' })
  const headingSize = useBreakpointValue({ base: 'md', md: 'lg' })
  const stackSpacing = useBreakpointValue({ base: 4, md: 8 })
  const boxWidth = useBreakpointValue({ base: '100%', md: '80%', lg: '60%' })

  const createRoom = async () => {
    try {
      setIsCreatingRoom(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CALLER_CONTRACT_ADDRESS, callerABI, signer)

      const tx = await contract.createRoom()
      await tx.wait()

      toast({
        title: 'Success',
        description: 'Room created successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error creating room:', error)
      toast({
        title: 'Error',
        description: 'Failed to create room',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const joinRoom = async () => {
    if (!roomId) {
      toast({
        title: 'Error',
        description: 'Please enter a room ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      setIsJoiningRoom(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CALLER_CONTRACT_ADDRESS, callerABI, signer)

      const tx = await contract.joinRoom(roomId)
      await tx.wait()

      toast({
        title: 'Success',
        description: 'Joined room successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error joining room:', error)
      toast({
        title: 'Error',
        description: 'Failed to join room',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsJoiningRoom(false)
    }
  }

  const deposit = async () => {
    if (!depositAmount) {
      toast({
        title: 'Error',
        description: 'Please enter a deposit amount',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      setIsDepositing(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CALLER_CONTRACT_ADDRESS, callerABI, signer)

      // Convert amount to wei (18 decimals)
      const amountInWei = ethers.parseEther(depositAmount)
      const tx = await contract.deposit(amountInWei)
      await tx.wait()

      toast({
        title: 'Success',
        description: 'Deposit successful!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error depositing:', error)
      toast({
        title: 'Error',
        description: 'Failed to deposit',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsDepositing(false)
    }
  }

  return (
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
              size={useBreakpointValue({ base: 'lg', md: '2x', lg: '2x' })} 
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
            size={useBreakpointValue({ base: 'sm', md: 'md', lg: 'lg' })}
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
                <BusinessRoomCreation account={account} />
              </TabPanel>
              <TabPanel px={0}>
                <BusinessRoomJoin account={account} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Box>
    </Container>
  )
}

export default BusinessRoom 