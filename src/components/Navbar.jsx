import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Text,
  useToast,
} from '@chakra-ui/react'
import './Navbar.css'

function Navbar({ account, onConnect }) {
  const toast = useToast()

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
            {!account ? (
              <Button
                colorScheme="blue"
                size="lg"
                onClick={onConnect}
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
  )
}

export default Navbar 