'use server';

import { captureRepository } from '@/data/repositories/capture-repository';
import { revalidatePath } from 'next/cache';

interface CaptureResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Quick capture a single idea (used in focus mode)
 */
export async function captureIdea(text: string): Promise<CaptureResult> {
  try {
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'Please enter an idea',
      };
    }

    const capture = await captureRepository.create({
      rawText: text.trim(),
      source: 'focus_mode',
    });

    revalidatePath('/clarify');
    revalidatePath('/upload');

    return {
      success: true,
      data: capture,
    };
  } catch (error) {
    console.error('Error capturing idea:', error);
    return {
      success: false,
      error: 'Failed to capture idea',
    };
  }
}
