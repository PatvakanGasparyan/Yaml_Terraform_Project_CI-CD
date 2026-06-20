import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { OpenAICompletionRequest, OpenAICompletionResponse } from './openai.types';

@Injectable()
export class OpenAIClient {
  private readonly logger = new Logger(OpenAIClient.name);
  private client: OpenAI | null = null;
  private readonly defaultModel: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    this.defaultModel = this.config.get<string>('OPENAI_MODEL', 'gpt-4o');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not configured — AI features disabled');
    }
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  async complete(request: OpenAICompletionRequest): Promise<OpenAICompletionResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in environment.');
    }

    const model = request.model || this.defaultModel;

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens ?? 4096,
      response_format: request.jsonMode ? { type: 'json_object' } : undefined,
    });

    const choice = response.choices[0];
    return {
      content: choice?.message?.content || '',
      tokensInput: response.usage?.prompt_tokens || 0,
      tokensOutput: response.usage?.completion_tokens || 0,
      model,
    };
  }
}
