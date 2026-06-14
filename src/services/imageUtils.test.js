/**
 * Unit Tests for Image Utility Functions
 * 
 * Tests the convertToBase64 utility function with various input formats
 * and error conditions.
 * 
 * Note: These tests require a testing framework (e.g., Vitest, Jest) to run.
 */

import { describe, it, expect } from 'vitest';
import { convertToBase64 } from './imageUtils.js';

describe('convertToBase64', () => {
  describe('string inputs', () => {
    it('should extract base64 from data URL with jpeg', async () => {
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const result = await convertToBase64(dataUrl);
      expect(result).toBe('/9j/4AAQSkZJRg==');
    });

    it('should extract base64 from data URL with png', async () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      const result = await convertToBase64(dataUrl);
      expect(result).toBe('iVBORw0KGgoAAAANSUhEUgAAAAUA');
    });

    it('should return plain base64 string unchanged', async () => {
      const base64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD';
      const result = await convertToBase64(base64);
      expect(result).toBe(base64);
    });

    it('should throw error for null input', async () => {
      await expect(convertToBase64(null)).rejects.toThrow('Image data cannot be null or undefined');
    });

    it('should throw error for undefined input', async () => {
      await expect(convertToBase64(undefined)).rejects.toThrow('Image data cannot be null or undefined');
    });

    it('should throw error for empty string', async () => {
      await expect(convertToBase64('')).rejects.toThrow('Image data string cannot be empty');
    });

    it('should throw error for whitespace-only string', async () => {
      await expect(convertToBase64('   ')).rejects.toThrow('Image data string cannot be empty');
    });

    it('should throw error for data URL with empty base64', async () => {
      const dataUrl = 'data:image/jpeg;base64,';
      await expect(convertToBase64(dataUrl)).rejects.toThrow('Data URL contains empty base64 data');
    });
  });

  describe('File inputs', () => {
    it('should convert File to data URL', async () => {
      // Create a mock File object
      const content = 'fake image content';
      const file = new File([content], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await convertToBase64(file);
      
      // Result should be a data URL
      expect(result).toMatch(/^data:image\/jpeg;base64,/);
      expect(result.length).toBeGreaterThan(30); // Has content
    });

    it('should throw error for empty File', async () => {
      const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });
      await expect(convertToBase64(emptyFile)).rejects.toThrow('Image file/blob is empty (0 bytes)');
    });
  });

  describe('Blob inputs', () => {
    it('should convert Blob to data URL', async () => {
      // Create a mock Blob object
      const content = 'fake image content';
      const blob = new Blob([content], { type: 'image/png' });
      
      const result = await convertToBase64(blob);
      
      // Result should be a data URL
      expect(result).toMatch(/^data:image\/png;base64,/);
      expect(result.length).toBeGreaterThan(30); // Has content
    });

    it('should throw error for empty Blob', async () => {
      const emptyBlob = new Blob([], { type: 'image/jpeg' });
      await expect(convertToBase64(emptyBlob)).rejects.toThrow('Image file/blob is empty (0 bytes)');
    });
  });

  describe('invalid input types', () => {
    it('should throw error for number input', async () => {
      await expect(convertToBase64(123)).rejects.toThrow('Invalid image data type: number');
    });

    it('should throw error for object input', async () => {
      await expect(convertToBase64({})).rejects.toThrow('Invalid image data type: object');
    });

    it('should throw error for array input', async () => {
      await expect(convertToBase64([])).rejects.toThrow('Invalid image data type: object');
    });
  });

  describe('edge cases', () => {
    it('should handle data URL with different image formats', async () => {
      const formats = [
        'data:image/webp;base64,UklGR',
        'data:image/gif;base64,R0lGOD',
        'data:image/svg+xml;base64,PHN2Zy'
      ];

      for (const dataUrl of formats) {
        const result = await convertToBase64(dataUrl);
        expect(result).not.toContain('data:');
        expect(result).not.toContain('base64,');
      }
    });

    it('should handle very long base64 strings', async () => {
      const longBase64 = 'a'.repeat(10000);
      const result = await convertToBase64(longBase64);
      expect(result).toBe(longBase64);
    });
  });

  describe('data immutability - Requirements 7.1, AC5', () => {
    it('should not mutate base64 string input', async () => {
      const originalBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD';
      const inputCopy = originalBase64;
      
      const result = await convertToBase64(originalBase64);
      
      // Verify input string is unchanged
      expect(originalBase64).toBe(inputCopy);
      expect(result).toBe(originalBase64);
    });

    it('should not mutate data URL string input', async () => {
      const originalDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const inputCopy = originalDataUrl;
      
      const result = await convertToBase64(originalDataUrl);
      
      // Verify input string is unchanged
      expect(originalDataUrl).toBe(inputCopy);
      expect(originalDataUrl).toContain('data:image/jpeg');
    });

    it('should not mutate File object input', async () => {
      const content = 'test image data';
      const file = new File([content], 'test.jpg', { type: 'image/jpeg' });
      
      // Capture original properties
      const originalName = file.name;
      const originalSize = file.size;
      const originalType = file.type;
      
      const result = await convertToBase64(file);
      
      // Verify File object properties are unchanged
      expect(file.name).toBe(originalName);
      expect(file.size).toBe(originalSize);
      expect(file.type).toBe(originalType);
      expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should not mutate Blob object input', async () => {
      const content = 'test blob data';
      const blob = new Blob([content], { type: 'image/png' });
      
      // Capture original properties
      const originalSize = blob.size;
      const originalType = blob.type;
      
      const result = await convertToBase64(blob);
      
      // Verify Blob object properties are unchanged
      expect(blob.size).toBe(originalSize);
      expect(blob.type).toBe(originalType);
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should be side-effect free for multiple calls with same input', async () => {
      const base64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD';
      
      // Call multiple times with same input
      const result1 = await convertToBase64(base64);
      const result2 = await convertToBase64(base64);
      const result3 = await convertToBase64(base64);
      
      // All results should be identical
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(base64).toBe('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD');
    });

    it('should not alter File object across multiple conversions', async () => {
      const content = 'persistent test data';
      const file = new File([content], 'persistent.jpg', { type: 'image/jpeg' });
      
      const originalSize = file.size;
      
      // Convert multiple times
      await convertToBase64(file);
      await convertToBase64(file);
      await convertToBase64(file);
      
      // File should remain unchanged
      expect(file.size).toBe(originalSize);
      expect(file.name).toBe('persistent.jpg');
    });
  });
});
