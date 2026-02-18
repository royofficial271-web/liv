
export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: Date;
}

export interface LiveTranscript {
  id: string;
  userText: string;
  modelText: string;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
}
