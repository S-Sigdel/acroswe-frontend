import { useState, useEffect } from 'react'
import {
  ChakraProvider,
  Box,
  Flex,
  Heading,
  Button,
  Text,
  Container,
  HStack,
  VStack,
  useToast,
  extendTheme
} from '@chakra-ui/react'
import { ethers } from 'ethers'
import Dashboard from './components/Dashboard'
import Navbar from './components/Navbar'
import './App.css'

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
      },
    },
  },
})

function App() {
  const [account, setAccount] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    checkWalletConnection()
  }, [])

  const checkWalletConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setAccount(accounts[0])
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setAccount(accounts[0])
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const disconnectWallet = async () => {
    try {
      // Clear the account state
      setAccount(null)
      
      // If you need to do any cleanup with the provider
      if (window.ethereum) {
        // You might want to remove any event listeners here
        window.ethereum.removeAllListeners()
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }

  const handleAccountChange = (newAccount) => {
    setAccount(newAccount)
  }

  if (isLoading) {
    return (
      <ChakraProvider theme={theme}>
        <Navbar account={account} onConnect={connectWallet} onDisconnect={disconnectWallet} />
        <Box pt="60px">
          <Dashboard account={account} onAccountChange={handleAccountChange} />
        </Box>
      </ChakraProvider>
    )
  }

  return (
    <ChakraProvider theme={theme}>
      <Navbar account={account} onConnect={connectWallet} onDisconnect={disconnectWallet} />
      <Box pt="60px">
        <Dashboard account={account} onAccountChange={handleAccountChange} />
      </Box>
    </ChakraProvider>
  )
}

export default App
