import { parseCaptureBatch, canDeleteCaptureItem, canParkCaptureItem } from '@/domain/capture/rules';

describe('Capture Domain Rules', () => {
  describe('parseCaptureBatch', () => {
    it('should parse one line as one capture item', () => {
      const input = 'Fix authentication bug';
      const result = parseCaptureBatch(input);
      expect(result).toEqual(['Fix authentication bug']);
    });

    it('should parse multiple lines into multiple capture items', () => {
      const input = `Fix authentication bug
Update documentation
Research API design patterns`;
      const result = parseCaptureBatch(input);
      expect(result).toEqual([
        'Fix authentication bug',
        'Update documentation',
        'Research API design patterns',
      ]);
    });

    it('should ignore empty lines', () => {
      const input = `Fix authentication bug

Update documentation


Research API design patterns`;
      const result = parseCaptureBatch(input);
      expect(result).toEqual([
        'Fix authentication bug',
        'Update documentation',
        'Research API design patterns',
      ]);
    });

    it('should trim whitespace from each line', () => {
      const input = `  Fix authentication bug
    Update documentation
Research API design patterns  `;
      const result = parseCaptureBatch(input);
      expect(result).toEqual([
        'Fix authentication bug',
        'Update documentation',
        'Research API design patterns',
      ]);
    });

    it('should return empty array for empty input', () => {
      const input = '';
      const result = parseCaptureBatch(input);
      expect(result).toEqual([]);
    });
  });

  describe('canDeleteCaptureItem', () => {
    it('should allow deletion of UNPROCESSED items', () => {
      expect(canDeleteCaptureItem('UNPROCESSED')).toBe(true);
    });

    it('should allow deletion of PARKED items', () => {
      expect(canDeleteCaptureItem('PARKED')).toBe(true);
    });

    it('should not allow deletion of PROCESSED items', () => {
      expect(canDeleteCaptureItem('PROCESSED')).toBe(false);
    });
  });

  describe('canParkCaptureItem', () => {
    it('should allow parking of UNPROCESSED items', () => {
      expect(canParkCaptureItem('UNPROCESSED')).toBe(true);
    });

    it('should not allow parking of already PARKED items', () => {
      expect(canParkCaptureItem('PARKED')).toBe(false);
    });

    it('should not allow parking of PROCESSED items', () => {
      expect(canParkCaptureItem('PROCESSED')).toBe(false);
    });
  });
});
