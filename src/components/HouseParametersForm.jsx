import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Text,
  Heading,
  Spinner,
} from '@chakra-ui/react';

const propertyTypes = [
  "Single Family",
  "Multi Family",
  "Townhouse",
  "Condo",
  "Apartment"
];

const conditions = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Fair" },
  { value: 3, label: "Good" },
  { value: 4, label: "Very Good" },
  { value: 5, label: "Excellent" }
];

const schoolRatings = Array.from({ length: 10 }, (_, i) => i + 1);

function HouseParametersForm({ onSubmit, socket, roomId, account }) {
  const [formData, setFormData] = useState({
    Built_Year: 2000,
    Renovation_Year: 2020,
    Lot_Size_acres: 0.5,
    Square_Footage: 2000,
    Bedrooms: 3,
    Bathrooms: 2,
    Garage_Spaces: 2,
    Property_Type: "Single Family",
    Property_Tax_Annual: 5000,
    School_Rating_1_10: 7,
    Distance_to_Princeton_University_miles: 5,
    Condition_1_5: 3,
    Has_Pool: 0,
    Has_Basement: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('=== SENDING PREDICTION REQUEST ===');
      console.log('Form Data:', formData);
      
      // Ensure all numeric values are properly formatted
      const formattedData = {
        Built_Year: parseInt(formData.Built_Year),
        Renovation_Year: parseInt(formData.Renovation_Year),
        Lot_Size_acres: parseFloat(formData.Lot_Size_acres),
        Square_Footage: parseFloat(formData.Square_Footage),
        Bedrooms: parseInt(formData.Bedrooms),
        Bathrooms: parseFloat(formData.Bathrooms),
        Garage_Spaces: parseInt(formData.Garage_Spaces),
        Property_Type: formData.Property_Type,
        Property_Tax_Annual: parseFloat(formData.Property_Tax_Annual),
        School_Rating_1_10: parseInt(formData.School_Rating_1_10),
        Distance_to_Princeton_University_miles: parseFloat(formData.Distance_to_Princeton_University_miles),
        Condition_1_5: parseInt(formData.Condition_1_5),
        Has_Pool: parseInt(formData.Has_Pool),
        Has_Basement: parseInt(formData.Has_Basement)
      };

      console.log('Formatted Data:', formattedData);
      
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        throw new Error("Prediction failed");
      }

      const data = await response.json();
      console.log('Received prediction data:', data);
      
      setPrediction(data.prediction);

      // Emit prediction to all participants
      console.log('Emitting prediction to room:', roomId);
      socket.emit('predictionMade', {
        roomId,
        account,
        prediction: data.prediction,
        formData: formattedData
      });

      // Call onSubmit after emitting to socket
      onSubmit(data.prediction);

      toast({
        title: 'Prediction Complete',
        description: `Predicted Price: $${data.prediction.toLocaleString()}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Prediction error:', error);
      setError("Failed to fetch prediction");
      toast({
        title: 'Error',
        description: 'Failed to get prediction. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Box
      p={6}
      bg="gray.700"
      borderRadius="lg"
      border="1px solid"
      borderColor="blue.400"
      _hover={{
        borderColor: 'blue.300',
        boxShadow: '0 0 10px rgba(66, 153, 225, 0.2)',
        transition: 'all 0.2s'
      }}
    >
      <VStack spacing={6} align="stretch">
        <Heading size="md" color="blue.400">House Parameters</Heading>
        
        <HStack spacing={4}>
          <FormControl>
            <FormLabel>Built Year</FormLabel>
            <NumberInput
              value={formData.Built_Year}
              onChange={(value) => handleChange('Built_Year', parseInt(value))}
              min={1800}
              max={2024}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl>
            <FormLabel>Renovation Year</FormLabel>
            <NumberInput
              value={formData.Renovation_Year}
              onChange={(value) => handleChange('Renovation_Year', parseInt(value))}
              min={1800}
              max={2024}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </HStack>

        <HStack spacing={4}>
          <FormControl>
            <FormLabel>Lot Size (acres)</FormLabel>
            <NumberInput
              value={formData.Lot_Size_acres}
              onChange={(value) => handleChange('Lot_Size_acres', parseFloat(value))}
              min={0}
              step={0.1}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl>
            <FormLabel>Square Footage</FormLabel>
            <NumberInput
              value={formData.Square_Footage}
              onChange={(value) => handleChange('Square_Footage', parseInt(value))}
              min={100}
              step={100}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </HStack>

        <HStack spacing={4}>
          <FormControl>
            <FormLabel>Bedrooms</FormLabel>
            <NumberInput
              value={formData.Bedrooms}
              onChange={(value) => handleChange('Bedrooms', parseInt(value))}
              min={1}
              max={10}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl>
            <FormLabel>Bathrooms</FormLabel>
            <NumberInput
              value={formData.Bathrooms}
              onChange={(value) => handleChange('Bathrooms', parseFloat(value))}
              min={1}
              max={10}
              step={0.5}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </HStack>

        <HStack spacing={4}>
          <FormControl>
            <FormLabel>Garage Spaces</FormLabel>
            <NumberInput
              value={formData.Garage_Spaces}
              onChange={(value) => handleChange('Garage_Spaces', parseInt(value))}
              min={0}
              max={5}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl>
            <FormLabel>Property Type</FormLabel>
            <Select
              value={formData.Property_Type}
              onChange={(e) => handleChange('Property_Type', e.target.value)}
            >
              {propertyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </FormControl>
        </HStack>

        <HStack spacing={4}>
          <FormControl>
            <FormLabel>Property Tax (Annual)</FormLabel>
            <NumberInput
              value={formData.Property_Tax_Annual}
              onChange={(value) => handleChange('Property_Tax_Annual', parseInt(value))}
              min={0}
              step={1000}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl>
            <FormLabel>School Rating (1-10)</FormLabel>
            <Select
              value={formData.School_Rating_1_10}
              onChange={(e) => handleChange('School_Rating_1_10', parseInt(e.target.value))}
            >
              {schoolRatings.map(rating => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </Select>
          </FormControl>
        </HStack>

        <HStack spacing={4}>
          <FormControl>
            <FormLabel>Distance to Princeton (miles)</FormLabel>
            <NumberInput
              value={formData.Distance_to_Princeton_University_miles}
              onChange={(value) => handleChange('Distance_to_Princeton_University_miles', parseFloat(value))}
              min={0}
              step={0.1}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl>
            <FormLabel>Condition (1-5)</FormLabel>
            <Select
              value={formData.Condition_1_5}
              onChange={(e) => handleChange('Condition_1_5', parseInt(e.target.value))}
            >
              {conditions.map(condition => (
                <option key={condition.value} value={condition.value}>{condition.label}</option>
              ))}
            </Select>
          </FormControl>
        </HStack>

        <HStack spacing={4}>
          <FormControl>
            <FormLabel>Has Pool</FormLabel>
            <Select
              value={formData.Has_Pool}
              onChange={(e) => handleChange('Has_Pool', parseInt(e.target.value))}
            >
              <option value={0}>No</option>
              <option value={1}>Yes</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Has Basement</FormLabel>
            <Select
              value={formData.Has_Basement}
              onChange={(e) => handleChange('Has_Basement', parseInt(e.target.value))}
            >
              <option value={0}>No</option>
              <option value={1}>Yes</option>
            </Select>
          </FormControl>
        </HStack>

        <Button
          colorScheme="blue"
          size="lg"
          onClick={handleSubmit}
          isLoading={loading}
          loadingText="Predicting..."
          boxShadow="0 0 15px rgba(66, 153, 225, 0.4)"
          transform="scale(1.05)"
          transition="all 0.2s"
        >
          Get Price Prediction
        </Button>

        {error && (
          <Text color="red.400" textAlign="center">
            {error}
          </Text>
        )}

        {prediction !== null && (
          <Box
            p={4}
            bg="gray.800"
            borderRadius="lg"
            border="1px solid"
            borderColor="green.400"
          >
            <VStack spacing={2}>
              <Text color="green.400" fontSize="lg" fontWeight="bold">
                Estimated Price
              </Text>
              <Text color="white" fontSize="2xl">
                ${prediction.toLocaleString()}
              </Text>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

export default HouseParametersForm; 