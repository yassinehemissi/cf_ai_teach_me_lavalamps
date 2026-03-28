export type ChatRole = "assistant" | "user";

export type ChatMessage = {
  content: string;
  role: ChatRole;
};
