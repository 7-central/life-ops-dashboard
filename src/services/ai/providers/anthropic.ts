/**
 * Anthropic AI Provider Implementation
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  AIProviderInterface,
  TaskForAI,
  PriorityScore,
  BulkPrioritizationResult,
} from '../types';

// JSON Schema for single task priority score
const PRIORITY_SCORE_SCHEMA = {
  type: 'object',
  properties: {
    score: {
      type: 'number',
      description: 'Priority score from 0-100',
    },
    suggestedBucket: {
      type: 'string',
      enum: ['NOW', 'NEXT', 'LATER'],
      description: 'Recommended priority bucket',
    },
    reasoning: {
      type: 'string',
      description: '1-2 sentence explanation of the score',
    },
    confidence: {
      type: 'number',
      description: 'Confidence level from 0-1',
    },
    factors: {
      type: 'object',
      properties: {
        urgencyScore: { type: 'number' },
        impactScore: { type: 'number' },
        effortScore: { type: 'number' },
        deadlineProximity: { type: ['number', 'null'] },
        energyAlignment: { type: ['number', 'null'] },
      },
      required: ['urgencyScore', 'impactScore', 'effortScore'],
    },
  },
  required: ['score', 'suggestedBucket', 'reasoning', 'confidence', 'factors'],
} as const;

// JSON Schema for bulk prioritization result
const BULK_PRIORITY_SCHEMA = {
  type: 'object',
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          score: { type: 'number' },
          suggestedBucket: {
            type: 'string',
            enum: ['NOW', 'NEXT', 'LATER'],
          },
          reasoning: { type: 'string' },
          confidence: { type: 'number' },
          factors: {
            type: 'object',
            properties: {
              urgencyScore: { type: 'number' },
              impactScore: { type: 'number' },
              effortScore: { type: 'number' },
              deadlineProximity: { type: ['number', 'null'] },
              energyAlignment: { type: ['number', 'null'] },
            },
            required: ['urgencyScore', 'impactScore', 'effortScore'],
          },
        },
        required: ['taskId', 'score', 'suggestedBucket', 'reasoning', 'confidence', 'factors'],
      },
    },
    recommendations: {
      type: 'object',
      properties: {
        now: {
          type: 'array',
          items: { type: 'string' },
          description: 'Task IDs for NOW bucket (max 1)',
        },
        next: {
          type: 'array',
          items: { type: 'string' },
          description: 'Task IDs for NEXT bucket (max 3)',
        },
        later: {
          type: 'array',
          items: { type: 'string' },
          description: 'Task IDs for LATER bucket',
        },
      },
      required: ['now', 'next', 'later'],
    },
    summary: {
      type: 'string',
      description: '2-3 sentence explanation of prioritization strategy',
    },
  },
  required: ['scores', 'recommendations', 'summary'],
} as const;

export class AnthropicProvider implements AIProviderInterface {
  private client: Anthropic;
  private model: string = 'claude-haiku-4-5';

  constructor(apiKey: string) {
    console.log('AnthropicProvider initialized');
    console.log('API Key present:', !!apiKey);
    console.log('API Key prefix:', apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING');
    console.log('Model:', this.model);

    this.client = new Anthropic({
      apiKey,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.beta.messages.create({
        model: this.model,
        max_tokens: 10,
        betas: ['structured-outputs-2025-11-13'],
        messages: [{ role: 'user', content: 'test' }],
      } as any);
      return response.content.length > 0;
    } catch (error) {
      console.error('Anthropic connection test failed:', error);
      return false;
    }
  }

  async scoreTaskPriority(task: TaskForAI): Promise<PriorityScore> {
    const prompt = this.buildSingleTaskPrompt(task);

    try {
      const response = await this.client.beta.messages.create({
        model: this.model,
        max_tokens: 1024,
        betas: ['structured-outputs-2025-11-13'],
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        output_format: {
          type: 'json_schema',
          schema: PRIORITY_SCORE_SCHEMA,
        },
      } as any); // Type assertion needed for beta feature

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      const result = JSON.parse(content.text);
      return {
        taskId: task.id,
        score: result.score,
        suggestedBucket: result.suggestedBucket,
        reasoning: result.reasoning,
        confidence: result.confidence,
        factors: result.factors,
      };
    } catch (error: unknown) {
      console.error('Error scoring task priority with Anthropic:');
      if (error && typeof error === 'object') {
        console.error('Error type:', error.constructor?.name);
        if ('message' in error) {
          console.error('Error message:', error.message);
        }
        if ('status' in error) {
          console.error('API Status:', (error as any).status);
        }
        if ('error' in error) {
          console.error('API Error:', JSON.stringify((error as any).error, null, 2));
        }
      }
      console.error('Full error:', error);
      throw new Error(`Failed to score task priority: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async scoreBulkPriority(tasks: TaskForAI[]): Promise<BulkPrioritizationResult> {
    const prompt = this.buildBulkTaskPrompt(tasks);

    try {
      console.log('AI Request - Model:', this.model);
      console.log('AI Request - Task count:', tasks.length);
      console.log('AI Request - Using beta API with structured outputs');

      const response = await this.client.beta.messages.create({
        model: this.model,
        max_tokens: 4096,
        betas: ['structured-outputs-2025-11-13'],
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        output_format: {
          type: 'json_schema',
          schema: BULK_PRIORITY_SCHEMA,
        },
      } as any); // Type assertion needed for beta feature

      console.log('AI Response received - Stop reason:', response.stop_reason);
      console.log('AI Response - Content type:', response.content[0]?.type);

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      const result = JSON.parse(content.text);
      console.log('AI Response parsed successfully - Recommendations:', {
        now: result.recommendations?.now?.length || 0,
        next: result.recommendations?.next?.length || 0,
        later: result.recommendations?.later?.length || 0,
      });
      return result;
    } catch (error: unknown) {
      console.error('Error scoring bulk priorities with Anthropic:');
      if (error && typeof error === 'object') {
        console.error('Error type:', error.constructor?.name);
        if ('message' in error) {
          console.error('Error message:', error.message);
        }
        if ('status' in error) {
          console.error('API Status:', (error as any).status);
        }
        if ('error' in error) {
          console.error('API Error:', JSON.stringify((error as any).error, null, 2));
        }
      }
      console.error('Full error:', error);
      throw new Error(`Failed to score bulk priorities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSingleTaskPrompt(task: TaskForAI): string {
    return `You are a task prioritization expert. Analyze the following task and provide a priority score.

Task Details:
- Title: ${task.title}
- Domain: ${task.domainAreaName || 'Not specified'}
- Project: ${task.projectName || 'Not specified'}
- Notes: ${task.notes || 'None'}
- Definition of Done: ${task.dodItems?.join(', ') || 'Not specified'}
- Next Action: ${task.nextAction || 'Not specified'}
- Estimated Duration: ${task.durationMinutes || 'Not estimated'} minutes
- Due Date: ${task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'Not set'}
- Current Urgency: ${task.urgency || 'Not rated'} (1-5 scale)
- Current Impact: ${task.impact || 'Not rated'} (1-5 scale)
- Current Effort: ${task.effort || 'Not rated'} (1-5 scale)
- Energy Fit: ${task.energyFit || 'Not specified'}
- Tags: ${task.tags?.join(', ') || 'None'}
- Contexts: ${task.contexts?.join(', ') || 'None'}

Priority Buckets:
- NOW: The single most important task (maximum 1 task)
- NEXT: Up next (maximum 3 tasks)
- LATER: Backlog

Analyze the task and return a JSON object with this exact structure:
{
  "score": <number 0-100>,
  "suggestedBucket": "<NOW|NEXT|LATER>",
  "reasoning": "<1-2 sentence explanation>",
  "confidence": <number 0-1>,
  "factors": {
    "urgencyScore": <number 0-100>,
    "impactScore": <number 0-100>,
    "effortScore": <number 0-100>,
    "deadlineProximity": <number 0-100 or null>,
    "energyAlignment": <number 0-100 or null>
  }
}

Consider:
1. Urgency: How time-sensitive is this task?
2. Impact: What's the value/consequence of completing it?
3. Effort: How much work is required? (Lower effort = higher score if impact is high)
4. Deadline: Is there a due date approaching?
5. Clarity: Are the DoD and next action well-defined?

Calculate score using: (urgency × impact) / effort, adjusted for deadlines and clarity.`;
  }

  private buildBulkTaskPrompt(tasks: TaskForAI[]): string {
    const taskList = tasks
      .map(
        (task, idx) => `
Task ${idx + 1}:
- ID: ${task.id}
- Title: ${task.title}
- Domain: ${task.domainAreaName || 'Not specified'}
- Notes: ${task.notes || 'None'}
- Due Date: ${task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'Not set'}
- Urgency: ${task.urgency || 'Not rated'}/5
- Impact: ${task.impact || 'Not rated'}/5
- Effort: ${task.effort || 'Not rated'}/5
- Duration: ${task.durationMinutes || '?'} min
`
      )
      .join('\n---\n');

    return `You are a task prioritization expert. Analyze these ${tasks.length} tasks and recommend how to distribute them across priority buckets.

${taskList}

Priority Buckets:
- NOW: Maximum 1 task (what to work on right now)
- NEXT: Maximum 3 tasks (what's coming up)
- LATER: Unlimited (backlog)

Return a JSON object with this exact structure:
{
  "scores": [
    {
      "taskId": "<task.id>",
      "score": <number 0-100>,
      "suggestedBucket": "<NOW|NEXT|LATER>",
      "reasoning": "<1 sentence explanation>",
      "confidence": <number 0-1>,
      "factors": {
        "urgencyScore": <number 0-100>,
        "impactScore": <number 0-100>,
        "effortScore": <number 0-100>,
        "deadlineProximity": <number 0-100 or null>,
        "energyAlignment": <number 0-100 or null>
      }
    }
  ],
  "recommendations": {
    "now": ["<taskId>"],
    "next": ["<taskId>", "<taskId>", "<taskId>"],
    "later": ["<taskId>", ...]
  },
  "summary": "<2-3 sentence explanation of the prioritization strategy>"
}

Prioritization Rules:
1. Identify the SINGLE most critical task for NOW
2. Select up to 3 high-priority tasks for NEXT
3. Place remaining tasks in LATER
4. Consider: urgency, impact, effort, deadlines, and dependencies
5. Balance quick wins with high-impact work`;
  }
}
