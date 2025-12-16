/**
 * OpenAI Provider Implementation (Stub)
 * To be implemented when switching to OpenAI
 */

import type {
  AIProviderInterface,
  TaskForAI,
  PriorityScore,
  BulkPrioritizationResult,
} from '../types';

export class OpenAIProvider implements AIProviderInterface {
  // Stored for future implementation
  // @ts-expect-error - Placeholder for future implementation
  private apiKey: string;
  // @ts-expect-error - Placeholder for future implementation
  private model: string = 'gpt-4-turbo-preview';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async testConnection(): Promise<boolean> {
    // TODO: Implement OpenAI connection test
    console.warn('OpenAI provider not yet implemented');
    return false;
  }

  async scoreTaskPriority(task: TaskForAI): Promise<PriorityScore> {
    // TODO: Implement OpenAI task scoring
    // When implementing:
    // 1. Install openai package: npm install openai
    // 2. Import: import OpenAI from 'openai'
    // 3. Create client: this.client = new OpenAI({ apiKey: this.apiKey })
    // 4. Use chat completions API with JSON mode
    // 5. Use similar prompts to Anthropic provider

    throw new Error('OpenAI provider not yet implemented. Please use Anthropic provider.');
  }

  async scoreBulkPriority(tasks: TaskForAI[]): Promise<BulkPrioritizationResult> {
    // TODO: Implement OpenAI bulk scoring
    throw new Error('OpenAI provider not yet implemented. Please use Anthropic provider.');
  }

  // Helper method for building prompts (to be used when implementing)
  private buildPrompt(task: TaskForAI): string {
    // Similar to Anthropic provider's prompt building logic
    return '';
  }
}
