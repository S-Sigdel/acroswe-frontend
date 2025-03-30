import React from 'react';
import { Box, VStack, Text } from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faUser, 
  faCog, 
  faBuilding, 
  faPlus, 
  faSignInAlt,
  faStar as fasStar
} from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

function TestIcons() {
  return (
    <Box p={4} bg="gray.800" borderRadius="lg" m={4}>
      <VStack spacing={4} align="start">
        <Text color="white">Font Awesome Test Icons:</Text>
        
        {/* Basic icons */}
        <Box>
          <Text color="gray.300">Basic Icons:</Text>
          <FontAwesomeIcon icon={faHome} color="#4299E1" size="2x" />
          <Box as="span" display="inline-block" width="1rem" />
          <FontAwesomeIcon icon={faUser} color="#4299E1" size="2x" />
          <Box as="span" display="inline-block" width="1rem" />
          <FontAwesomeIcon icon={faCog} color="#4299E1" size="2x" />
        </Box>

        {/* Icons we're using in the app */}
        <Box>
          <Text color="gray.300">App Icons:</Text>
          <FontAwesomeIcon icon={faBuilding} color="#4299E1" size="2x" />
          <Box as="span" display="inline-block" width="1rem" />
          <FontAwesomeIcon icon={faPlus} color="#4299E1" size="2x" />
          <Box as="span" display="inline-block" width="1rem" />
          <FontAwesomeIcon icon={faSignInAlt} color="#4299E1" size="2x" />
        </Box>

        {/* Different icon styles */}
        <Box>
          <Text color="gray.300">Different Styles:</Text>
          <FontAwesomeIcon icon={fasStar} color="#ECC94B" size="2x" />
          <Box as="span" display="inline-block" width="1rem" />
          <FontAwesomeIcon icon={farStar} color="#ECC94B" size="2x" />
          <Box as="span" display="inline-block" width="1rem" />
          <FontAwesomeIcon icon={faGithub} color="#A0AEC0" size="2x" />
        </Box>
      </VStack>
    </Box>
  );
}

export default TestIcons; 