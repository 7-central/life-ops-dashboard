'use server';

import { userProfileRepository } from '@/data/repositories/user-profile-repository';
import { revalidatePath } from 'next/cache';
import Anthropic from '@anthropic-ai/sdk';

interface ProfileActionResult {
  success: boolean;
  error?: string;
  summary?: string;
}

/**
 * Update user profile
 */
export async function updateProfile(data: {
  longTermGoals?: string;
  mediumTermGoals?: string;
  shortTermFocus?: string;
  businessPlan?: string;
  lifePlan?: string;
  priorityPrinciples?: string;
  preferences?: string;
}): Promise<ProfileActionResult> {
  try {
    await userProfileRepository.update(data);

    revalidatePath('/profile');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      success: false,
      error: 'Failed to update profile',
    };
  }
}

/**
 * Generate AI summary of the user profile
 */
export async function generateProfileSummary(): Promise<ProfileActionResult> {
  try {
    const profile = await userProfileRepository.get();

    // Check if there's any content to summarize
    const hasContent =
      profile.longTermGoals ||
      profile.mediumTermGoals ||
      profile.shortTermFocus ||
      profile.businessPlan ||
      profile.lifePlan ||
      profile.priorityPrinciples ||
      profile.preferences;

    if (!hasContent) {
      return {
        success: false,
        error: 'Profile is empty. Please fill in at least one section before generating a summary.',
      };
    }

    // Create AI client
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'Anthropic API key not configured',
      };
    }

    const client = new Anthropic({ apiKey });

    // Build the full profile text
    const fullProfileText = `
# User Profile Context

## Long-Term Goals
${profile.longTermGoals || 'Not specified'}

## Medium-Term Goals (3-6 months)
${profile.mediumTermGoals || 'Not specified'}

## Short-Term Focus (1-4 weeks)
${profile.shortTermFocus || 'Not specified'}

## Business Plan / Focus Areas
${profile.businessPlan || 'Not specified'}

## Life Plan / Personal Priorities
${profile.lifePlan || 'Not specified'}

## Prioritization Principles
${profile.priorityPrinciples || 'Not specified'}

## Preferences (batching, tone, etc.)
${profile.preferences || 'Not specified'}
    `.trim();

    // Generate summary using Claude
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20250429',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are helping to create a condensed profile summary for task prioritization AI calls.

Given the following user profile, create a concise summary (aim for 200-300 words) that captures:
1. Goal hierarchy (long/medium/short term)
2. Current focus areas
3. Prioritization rules (what matters most, what to avoid/defer)
4. Key projects and what success looks like
5. Any relevant preferences

The summary should be written in a way that can be injected into AI prompts for task prioritization. Focus on decision-critical context. Be concise but complete.

User Profile:
${fullProfileText}

Provide ONLY the summary text, no preamble or explanation.`,
        },
      ],
    });

    const summary = response.content[0].type === 'text' ? response.content[0].text : '';

    if (!summary) {
      return {
        success: false,
        error: 'Failed to generate summary from AI',
      };
    }

    // Save summary
    await userProfileRepository.updateSummary(summary);

    revalidatePath('/profile');

    return {
      success: true,
      summary,
    };
  } catch (error) {
    console.error('Error generating profile summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate summary',
    };
  }
}
