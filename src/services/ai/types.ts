/**
 * AI Service Types
 * Provider-agnostic interfaces for AI functionality
 */

import type { PriorityBucket, EnergyLevel } from '@/generated/prisma';

/**
 * Supported AI providers
 */
export type AIProvider = 'anthropic' | 'openai';

/**
 * Task data for AI analysis
 */
export interface TaskForAI {
  id: string;
  title: string;
  notes?: string;
  domainAreaName?: string;
  projectName?: string;
  dodItems?: string[];
  nextAction?: string;
  durationMinutes?: number;
  dueAt?: Date;
  urgency?: number; // 1-5
  impact?: number; // 1-5
  effort?: number; // 1-5
  energyFit?: EnergyLevel;
  tags?: string[];
  contexts?: string[];
}

/**
 * Priority score result from AI
 */
export interface PriorityScore {
  taskId: string;
  score: number; // 0-100
  suggestedBucket: PriorityBucket; // NOW, NEXT, or LATER
  reasoning: string;
  confidence: number; // 0-1
  factors: {
    urgencyScore: number;
    impactScore: number;
    effortScore: number;
    deadlineProximity?: number;
    energyAlignment?: number;
  };
}

/**
 * Bulk prioritization result
 */
export interface BulkPrioritizationResult {
  scores: PriorityScore[];
  recommendations: {
    now: string[]; // taskIds
    next: string[]; // taskIds
    later: string[]; // taskIds
  };
  summary: string;
}

/**
 * Base AI provider interface
 */
export interface AIProviderInterface {
  /**
   * Score a single task's priority
   */
  scoreTaskPriority(task: TaskForAI): Promise<PriorityScore>;

  /**
   * Score multiple tasks and suggest distribution
   */
  scoreBulkPriority(tasks: TaskForAI[]): Promise<BulkPrioritizationResult>;

  /**
   * Test provider connection
   */
  testConnection(): Promise<boolean>;
}

/**
 * AI service configuration
 */
export interface AIServiceConfig {
  provider: AIProvider;
  anthropicApiKey?: string;
  openaiApiKey?: string;
}
