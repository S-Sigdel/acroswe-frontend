import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Room, RoomStatus } from '@/types/business.types';
import { useWallet } from '@/hooks/useWallet';
import { createRoom, joinRoom } from '@/store/slices/businessSlice';
import { generateRoomCode } from '@/utils/helpers';

export const useBusinessRoom = () => {
  const dispatch = useDispatch();
  const { account } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = useCallback(async (title: string, requiresDeposit: boolean, depositAmount?: string) => {
    try {
      setIsLoading(true);
      const room: Room = {
        id: generateRoomCode(),
        code: generateRoomCode(),
        title,
        owner: account,
        status: RoomStatus.WAITING,
        participants: [],
        requiresDeposit,
        depositAmount,
        createdAt: Date.now(),
      };
      
      await dispatch(createRoom(room));
      return room;
    } catch (error) {
      throw new Error('Failed to create room');
    } finally {
      setIsLoading(false);
    }
  }, [account, dispatch]);

  return {
    handleCreateRoom,
    isLoading,
  };
}; 