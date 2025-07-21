export interface FavoriteItem {
  id: string;
  messageId: string;
  sessionId: string;
  userPrompt: string;
  aiResponse: string;
  model?: string;
  timestamp: Date;
}
