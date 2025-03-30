import { useState } from 'react'
import { ChakraProvider, Box, Flex, Heading, Button, Text, useToast, Container, HStack, VStack } from '@chakra-ui/react'
import { ethers } from 'ethers'
import './App.css'

function App() {
  const [account, setAccount] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const toast = useToast()

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: 'MetaMask not found',
          description: 'Please install MetaMask to use this application',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      setAccount(accounts[0])
      setIsConnected(true)
      
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.900" color="white">
        {/* 3D Navbar */}
        <Box 
          position="fixed" 
          top={0} 
          left={0} 
          right={0} 
          bg="gray.800" 
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)"
          zIndex={1000}
          transform="translateZ(20px)"
          className="navbar-3d"
        >
          <Container maxW="container.xl" py={4}>
            <Flex justify="space-between" align="center">
              <HStack spacing={4}>
                <Box 
                  className="logo-container"
                  position="relative"
                  transform="translateZ(30px)"
                >
                  <Heading 
                    as="h1" 
                    size="xl" 
                    color="blue.400"
                    textShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
                    letterSpacing="wider"
                  >
                    Acroswe
                  </Heading>
                </Box>
              </HStack>
              
              <Box transform="translateZ(30px)">
                {!isConnected ? (
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={connectWallet}
                    _hover={{ 
                      bg: 'blue.500',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(66, 153, 225, 0.3)'
                    }}
                    transition="all 0.2s"
                    boxShadow="0 4px 12px rgba(66, 153, 225, 0.2)"
                  >
                    Connect Wallet
                  </Button>
                ) : (
                  <Box
                    p={4}
                    bg="gray.700"
                    borderRadius="lg"
                    boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
                    border="1px solid"
                    borderColor="blue.500"
                  >
                    <Text fontSize="sm" color="gray.300">Connected Account</Text>
                    <Text fontFamily="mono" color="blue.300" fontSize="sm">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </Text>
                  </Box>
                )}
              </Box>
            </Flex>
          </Container>
        </Box>

        {/* Main Content */}
        <Container maxW="container.xl" pt={24}>
          <Box 
            mt={8} 
            p={8} 
            bg="gray.800" 
            borderRadius="xl" 
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
            border="1px solid"
            borderColor="gray.700"
          >
            <VStack spacing={6}>
              <Heading size="lg" color="blue.400">Welcome to Acroswe</Heading>
              <Text color="gray.300" textAlign="center">
                Connect your wallet to get started with the next generation of decentralized applications.
              </Text>
            </VStack>
          </Box>
        </Container>
      </Box>
    </ChakraProvider>
  )
}

export default App
