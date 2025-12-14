'use server';

import { captureRepository } from '@/data/repositories/capture-repository';
import { parseCaptureBatch } from '@/domain/capture/rules';
import { revalidatePath } from 'next/cache';

export interface UploadIdeasResult {
  success: boolean;
  count?: number;
  error?: string;
}

export async function uploadIdeas(formData: FormData): Promise<UploadIdeasResult> {
  try {
    const rawInput = formData.get('ideas') as string;

    if (!rawInput || rawInput.trim().length === 0) {
      return {
        success: false,
        error: 'Please enter at least one idea',
      };
    }

    // Parse batch using domain rule: one line = one capture item
    const captureTexts = parseCaptureBatch(rawInput);

    if (captureTexts.length === 0) {
      return {
        success: false,
        error: 'No valid ideas found',
      };
    }

    // Create capture items
    await captureRepository.createMany(
      captureTexts.map((text) => ({
        rawText: text,
        source: 'manual',
      }))
    );

    // Revalidate paths that might show capture items
    revalidatePath('/upload');
    revalidatePath('/clarify');

    return {
      success: true,
      count: captureTexts.length,
    };
  } catch (error) {
    console.error('Error uploading ideas:', error);
    return {
      success: false,
      error: 'Failed to save ideas. Please try again.',
    };
  }
}
