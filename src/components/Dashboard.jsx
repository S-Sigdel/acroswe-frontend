import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  useToast,
  Spinner,
} from '@chakra-ui/react'
import { ethers } from 'ethers'

const contractAddress = "0x34Bea57E63292729B0Df44F068349a36485ecA88"

const contractABI = [
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "hasNFT",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
]

function Dashboard({ account }) {
  const [hasNFT, setHasNFT] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    checkNFT()
  }, [account])

  const checkNFT = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(contractAddress, contractABI, provider)
      const hasNFTResult = await contract.hasNFT(account)
      setHasNFT(hasNFTResult)
    } catch (error) {
      console.error('Error checking NFT:', error)
      toast({
        title: 'Error',
        description: 'Failed to check NFT status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Container maxW="container.xl" pt={32}>
        <VStack spacing={8} align="center">
          <Spinner size="xl" color="blue.400" />
          <Text color="gray.300">Checking NFT status...</Text>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" pt={32}>
      <VStack spacing={8} align="center">
        <Heading color="blue.400">Dashboard</Heading>
        <Text color="gray.300">Welcome, {account.slice(0, 6)}...{account.slice(-4)}</Text>
        
        <Box 
          p={8} 
          bg="gray.800" 
          borderRadius="xl" 
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
          border="1px solid"
          borderColor="gray.700"
          w="100%"
          maxW="md"
        >
          <VStack spacing={6}>
            <Heading size="md" color="blue.400">NFT Status</Heading>
            {hasNFT ? (
              <Text color="green.400">You already own an NFT!</Text>
            ) : (
              <>
                <Text color="gray.300">You don't have an NFT yet.</Text>
                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={() => {
                    toast({
                      title: 'Coming Soon',
                      description: 'NFT minting functionality will be available soon!',
                      status: 'info',
                      duration: 5000,
                      isClosable: true,
                    })
                  }}
                  _hover={{ 
                    bg: 'blue.500',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(66, 153, 225, 0.3)'
                  }}
                  transition="all 0.2s"
                  boxShadow="0 4px 12px rgba(66, 153, 225, 0.2)"
                >
                  Mint NFT
                </Button>
              </>
            )}
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}

export default Dashboard 