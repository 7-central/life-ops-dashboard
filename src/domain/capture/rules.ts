/**
 * Business rules for Capture Items
 */

/**
 * Parse multi-line input into individual capture items
 * Rule: One line = one capture item
 */
export function parseCaptureBatch(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Validate that a capture item can be deleted
 */
export function canDeleteCaptureItem(status: string): boolean {
  // Can delete if not yet processed or already parked
  return status === 'UNPROCESSED' || status === 'PARKED';
}

/**
 * Validate that a capture item can be parked
 */
export function canParkCaptureItem(status: string): boolean {
  // Can park if unprocessed
  return status === 'UNPROCESSED';
}
