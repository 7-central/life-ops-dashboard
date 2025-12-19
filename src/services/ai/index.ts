/**
 * AI Service Factory
 * Provider-agnostic interface for AI functionality
 */

import type {
  AIProvider,
  AIProviderInterface,
  AIServiceConfig,
  TaskForAI,
  PriorityScore,
  BulkPrioritizationResult,
} from './types';
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider } from './providers/openai';

/**
 * Get AI service configuration from environment variables
 */
function getAIConfig(): AIServiceConfig {
  const provider = (process.env.AI_PROVIDER || 'anthropic') as AIProvider;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  return {
    provider,
    anthropicApiKey,
    openaiApiKey,
  };
}

/**
 * Create an AI provider instance based on configuration
 */
function createProvider(config: AIServiceConfig): AIProviderInterface {
  switch (config.provider) {
    case 'anthropic':
      if (!config.anthropicApiKey) {
        throw new Error(
          'ANTHROPIC_API_KEY environment variable is required. Please add it to your Vercel environment variables in Settings → Environment Variables.'
        );
      }
      return new AnthropicProvider(config.anthropicApiKey);

    case 'openai':
      if (!config.openaiApiKey) {
        throw new Error(
          'OPENAI_API_KEY environment variable is required. Please add it to your Vercel environment variables in Settings → Environment Variables.'
        );
      }
      return new OpenAIProvider(config.openaiApiKey);

    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

/**
 * Main AI Service class
 * Singleton that provides access to AI functionality
 */
class AIService {
  private static instance: AIService;
  private provider: AIProviderInterface | null = null;
  private config: AIServiceConfig | null = null;

  private constructor() {
    // Lazy initialization - don't create provider until first use
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Initialize the provider (lazy initialization)
   */
  private ensureProvider(): void {
    if (!this.provider) {
      this.config = getAIConfig();
      this.provider = createProvider(this.config);
    }
  }

  /**
   * Get current provider name
   */
  getProviderName(): AIProvider {
    this.ensureProvider();
    return this.config!.provider;
  }

  /**
   * Test connection to AI provider
   */
  async testConnection(): Promise<boolean> {
    this.ensureProvider();
    return this.provider!.testConnection();
  }

  /**
   * Score a single task's priority
   */
  async scoreTaskPriority(task: TaskForAI): Promise<PriorityScore> {
    this.ensureProvider();
    return this.provider!.scoreTaskPriority(task);
  }

  /**
   * Score multiple tasks and get distribution recommendations
   */
  async scoreBulkPriority(tasks: TaskForAI[], profileContext?: string): Promise<BulkPrioritizationResult> {
    this.ensureProvider();
    return this.provider!.scoreBulkPriority(tasks, profileContext);
  }

  /**
   * Switch to a different provider (for testing or user preference)
   */
  switchProvider(provider: AIProvider, apiKey: string): void {
    this.config = {
      ...this.config!,
      provider,
      ...(provider === 'anthropic' ? { anthropicApiKey: apiKey } : { openaiApiKey: apiKey }),
    };
    this.provider = createProvider(this.config);
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();

// Export types for use in other modules
export type { TaskForAI, PriorityScore, BulkPrioritizationResult } from './types';
