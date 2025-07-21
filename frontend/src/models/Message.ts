export interface Message {
  id: string;
  type: "human" | "ai";
  content: string;
  timestamp: Date;
  model?: string;
}
