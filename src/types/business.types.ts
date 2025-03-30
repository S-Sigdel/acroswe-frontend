export interface Room {
  id: string;
  code: string;
  title: string;
  owner: string;
  status: RoomStatus;
  participants: Participant[];
  depositAmount?: string;
  requiresDeposit: boolean;
  createdAt: number;
}

export interface Participant {
  address: string;
  hasNFT: boolean;
  hasDeposited: boolean;
  joinedAt: number;
}

export enum RoomStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
} 