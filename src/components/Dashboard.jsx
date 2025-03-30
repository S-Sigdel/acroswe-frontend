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
import axios from 'axios'
import { keyframes } from '@emotion/react'
import BusinessRoom from './BusinessRoom'

const contractAddress = "0x34Bea57E63292729B0Df44F068349a36485ecA88"
const VERBWIRE_API_KEY = import.meta.env.VITE_VERBWIRE_API_KEY
const VERBWIRE_API_URL = 'https://api.verbwire.com/v1'

const contractABI = [
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "hasNFT",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
]

// Define the button glow animation
const buttonGlow = keyframes`
  0% { box-shadow: 0 0 5px #4299E1; }
  50% { box-shadow: 0 0 15px #4299E1; }
  100% { box-shadow: 0 0 5px #4299E1; }
`

function Dashboard({ account, onAccountChange }) {
  const [hasNFT, setHasNFT] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMinting, setIsMinting] = useState(false)
  const [showBusinessRoom, setShowBusinessRoom] = useState(false)
  const toast = useToast()

  useEffect(() => {
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }

    // Initial check if account exists
    if (account) {
      checkNFT()
    }

    // Cleanup listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [account])

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      onAccountChange(null)
      setHasNFT(null)
    } else {
      // User switched accounts
      onAccountChange(accounts[0])
      await checkNFT()
    }
  }

  const handleChainChanged = () => {
    // Reload the page on chain change
    window.location.reload()
  }

  const checkNFT = async () => {
    try {
      setIsLoading(true)
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

  const mintNFT = async () => {
    try {
      setIsMinting(true)
      const response = await axios.post(
        `${VERBWIRE_API_URL}/nft/mint/quickMintFromMetadataUrl`,
        {
          allowPlatformToOperateToken: 'true',
          chain: 'sepolia',
          metadataUrl: 'https://ipfs.io/ipfs/bafkreigjkcafrutdcbicyr3new6aoowgbscf6wgqyty45ckd3xur7ymldm',
          recipientAddress: account
        },
        {
          headers: {
            'X-API-Key': VERBWIRE_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      )

      const transactionHash = response.data.quick_mint.transactionHash
      const blockExplorer = response.data.quick_mint.blockExplorer

      toast({
        title: 'Success!',
        description: (
          <Box>
            <Text>NFT minted successfully!</Text>
            <Text mt={2}>
              <a 
                href={blockExplorer} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#63B3ED', textDecoration: 'underline' }}
              >
                View on Etherscan
              </a>
            </Text>
          </Box>
        ),
        status: 'success',
        duration: 10000,
        isClosable: true,
      })

      // Wait for transaction to be confirmed (about 30 seconds)
      toast({
        title: 'Waiting for confirmation',
        description: 'Please wait while we verify your NFT ownership...',
        status: 'info',
        duration: 30000,
        isClosable: true,
      })

      // Wait for 30 seconds to allow transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 30000))

      // Refresh NFT status
      await checkNFT()

      // If still no NFT after refresh, show a message
      if (!hasNFT) {
        toast({
          title: 'Verification Failed',
          description: 'Please refresh the page manually to check your NFT status.',
          status: 'warning',
          duration: 10000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('Error minting NFT:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      console.error('Error headers:', error.response?.headers)
      
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to mint NFT. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsMinting(false)
    }
  }

  if (!account) {
    return (
      <Container maxW="container.xl" pt={32}>
        <VStack spacing={8} align="center">
          <Heading color="blue.400">Welcome to Acroswe</Heading>
          <Text color="gray.300" textAlign="center">
            Connect your wallet to get started with the next generation of decentralized applications.
          </Text>
        </VStack>
      </Container>
    )
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

  if (hasNFT && !showBusinessRoom) {
    return (
      <Container maxW="container.xl" pt={32}>
        <VStack spacing={8} align="center">
          <Heading color="blue.400">NFT Verified!</Heading>
          <Text color="green.400">You have access to the Business Room</Text>
          <Button
            colorScheme="blue"
            size="lg"
            onClick={() => setShowBusinessRoom(true)}
            leftIcon={<i className="fas fa-arrow-right"></i>}
            css={{
              animation: `${buttonGlow} 2s infinite`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(66, 153, 225, 0.3)'
              }
            }}
          >
            Enter Business Room
          </Button>
        </VStack>
      </Container>
    )
  }

  if (hasNFT && showBusinessRoom) {
    return <BusinessRoom account={account} />
  }

  return (
    <Container maxW="container.xl" pt={32}>
      <VStack spacing={8} align="center">
        <Heading color="blue.400">NFT Required</Heading>
        <Text color="gray.300">You need an NFT to access the Business Room</Text>
        <Button
          colorScheme="blue"
          size="lg"
          onClick={mintNFT}
          isLoading={isMinting}
          loadingText="Minting..."
          leftIcon={<i className="fas fa-coins"></i>}
          css={{
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(66, 153, 225, 0.3)'
            }
          }}
        >
          Mint NFT
        </Button>
      </VStack>
    </Container>
  )
}

export default Dashboard 