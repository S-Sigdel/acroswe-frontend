import React from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Switch,
  Button,
} from '@chakra-ui/react';
import { useBusinessRoom } from '@/hooks/useBusinessRoom';
import { Input } from '@/components/common/Input';
import { useToast } from '@/hooks/useToast';

export const RoomCreation: React.FC = () => {
  const { handleCreateRoom, isLoading } = useBusinessRoom();
  const { showToast } = useToast();
  const [formData, setFormData] = React.useState({
    title: '',
    requiresDeposit: false,
    depositAmount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const room = await handleCreateRoom(
        formData.title,
        formData.requiresDeposit,
        formData.depositAmount
      );
      showToast({
        title: 'Success',
        description: `Room created with code: ${room.code}`,
        status: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to create room',
        status: 'error',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={6}>
        <FormControl>
          <FormLabel>Room Title</FormLabel>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              title: e.target.value
            }))}
            placeholder="Enter room title"
          />
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">
            Require Deposit?
          </FormLabel>
          <Switch
            isChecked={formData.requiresDeposit}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requiresDeposit: e.target.checked
            }))}
          />
        </FormControl>

        {formData.requiresDeposit && (
          <FormControl>
            <FormLabel>Deposit Amount</FormLabel>
            <Input
              type="number"
              value={formData.depositAmount}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                depositAmount: e.target.value
              }))}
              placeholder="Enter amount"
            />
          </FormControl>
        )}

        <Button
          type="submit"
          isLoading={isLoading}
          loadingText="Creating Room..."
          w="full"
        >
          Create Room
        </Button>
      </VStack>
    </form>
  );
}; 