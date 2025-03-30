import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room, RoomStatus } from '@/types/business.types';

interface BusinessState {
  rooms: Room[];
  activeRoom: Room | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BusinessState = {
  rooms: [],
  activeRoom: null,
  isLoading: false,
  error: null,
};

const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    setRooms: (state, action: PayloadAction<Room[]>) => {
      state.rooms = action.payload;
    },
    addRoom: (state, action: PayloadAction<Room>) => {
      state.rooms.push(action.payload);
    },
    setActiveRoom: (state, action: PayloadAction<Room>) => {
      state.activeRoom = action.payload;
    },
    updateRoomStatus: (state, action: PayloadAction<{ roomId: string; status: RoomStatus }>) => {
      const room = state.rooms.find(r => r.id === action.payload.roomId);
      if (room) {
        room.status = action.payload.status;
      }
    },
  },
});

export const { setRooms, addRoom, setActiveRoom, updateRoomStatus } = businessSlice.actions;
export default businessSlice.reducer; 