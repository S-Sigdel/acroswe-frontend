import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Text,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faWallet, 
  faChevronDown, 
  faSignOutAlt 
} from '@fortawesome/free-solid-svg-icons'
import './Navbar.css'

function Navbar({ account, onConnect, onDisconnect }) {
  const toast = useToast()

  const handleDisconnect = () => {
    onDisconnect()
    toast({
      title: 'Wallet Disconnected',
      description: 'You have been disconnected from your wallet',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  return (
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
      h="60px"
    >
      <Container maxW="container.xl" h="100%" py={0}>
        <Flex justify="space-between" align="center" h="100%">
          <HStack spacing={4}>
            <Box 
              className="logo-container"
              position="relative"
              transform="translateZ(30px)"
            >
              <Heading 
                as="h1" 
                size="lg"
                color="blue.400"
                textShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
                letterSpacing="wider"
              >
                Acroswe
              </Heading>
            </Box>
          </HStack>
          
          <Box transform="translateZ(30px)">
            {!account ? (
              <Button
                colorScheme="blue"
                size="md"
                onClick={onConnect}
                leftIcon={<FontAwesomeIcon icon={faWallet} />}
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
              <Menu>
                <MenuButton
                  as={Button}
                  size="md"
                  variant="outline"
                  colorScheme="blue"
                  rightIcon={<FontAwesomeIcon icon={faChevronDown} />}
                  _hover={{ 
                    bg: 'blue.500',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(66, 153, 225, 0.3)'
                  }}
                >
                  <HStack spacing={2}>
                    <FontAwesomeIcon icon={faWallet} />
                    <Text fontSize="sm">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList bg="gray.800" borderColor="blue.500">
                  <MenuItem 
                    icon={<FontAwesomeIcon icon={faSignOutAlt} />}
                    onClick={handleDisconnect}
                    _hover={{ bg: 'gray.700' }}
                  >
                    Disconnect Wallet
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}

export default Navbar 