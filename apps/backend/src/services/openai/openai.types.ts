export const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
  'o1',
  'o1-mini',
] as const;

export type OpenAIModel = (typeof OPENAI_MODELS)[number];

export interface OpenAICompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface OpenAICompletionResponse {
  content: string;
  tokensInput: number;
  tokensOutput: number;
  model: string;
}

export interface OpenAIUsageContext {
  userId?: string;
  operation: string;
}
