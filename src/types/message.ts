export type MessageType = 'system' | 'user';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
}
