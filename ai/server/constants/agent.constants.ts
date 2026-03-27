import "server-only";

import { MAX_DAILY_CHAT_MESSAGES } from "@/ai/constants/chat.constants";

export const AGENT_MAX_ATTEMPTS = 3;
export const AGENT_MEMORY_CONTEXT_THRESHOLD = 0.4;
export const AGENT_MAX_RETRIEVED_KNOWLEDGE = 6;
export const AGENT_MAX_RETRIEVED_TOOLS = 5;
export const AGENT_DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
export const AGENT_DEFAULT_TOOL_NAMESPACE = "simulation-tools";
export const AGENT_KNOWLEDGE_MIN_SCORE = 0.7;
export const AGENT_DAILY_USER_QUOTA_LIMIT = MAX_DAILY_CHAT_MESSAGES;
