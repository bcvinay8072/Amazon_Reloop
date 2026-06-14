/**
 * Unit tests for Ollama service response parsing and validation
 * 
 * Tests cover:
 * - Response parsing (outer JSON and nested response field)
 * - Field presence validation
 * - Type validation for all fields
 * - Grade value constraints
 * - Confidence score range validation
 * - Array type validation for detectedIssues
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeItemImage } from './ollama.js';
import * as imageUtils from './imageUtils.js';

// Mock the imageUtils module
vi.mock('./imageUtils.js', () => ({
  convertToBase64: vi.fn()
}));

describe('Ollama Response Parsing and Validation', () => {
  const mockBase64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
  
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    imageUtils.convertToBase64.mockResolvedValue(mockBase64Image);
  });
  
  afterEach(() => {
    // Clean up fetch mocks
    vi.restoreAllMocks();
  });

  describe('Response Parsing', () => {
    it('should parse outer Ollama JSON response', async () => {
      const validAssessment = {
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        productName: 'Test Product',
        grade: 'Good',
        confidenceScore: 85,
        detectedIssues: ['minor scratch'],
        transparencyPassport: 'Good condition',
        estimatedResalePrice: 50
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          created_at: '2024-01-15T10:30:00.000Z',
          response: JSON.stringify(validAssessment),
          done: true
        })
      });

      const result = await analyzeItemImage('test.jpg');
      expect(result).toEqual(validAssessment);
    });

    it('should extract and parse nested response field (JSON string within JSON)', async () => {
      const nestedAssessment = {
        itemId: 'abc-123',
        productName: 'Laptop',
        grade: 'Pristine',
        confidenceScore: 95,
        detectedIssues: [],
        transparencyPassport: 'Perfect condition',
        estimatedResalePrice: 500
      };

      // Ollama returns JSON with a stringified JSON response field
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          created_at: '2024-01-15T10:30:00.000Z',
          response: JSON.stringify(nestedAssessment), // This is the nested JSON string
          done: true
        })
      });

      const result = await analyzeItemImage('laptop.jpg');
      expect(result.productName).toBe('Laptop');
      expect(result.grade).toBe('Pristine');
    });

    it('should throw error when response field is missing', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          created_at: '2024-01-15T10:30:00.000Z',
          done: true
          // Missing 'response' field
        })
      });

      await expect(analyzeItemImage('test.jpg'))
        .rejects.toThrow('Ollama API returned invalid response structure');
    });

    it('should throw error when nested response is not valid JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          created_at: '2024-01-15T10:30:00.000Z',
          response: 'not valid json {{{',
          done: true
        })
      });

      await expect(analyzeItemImage('test.jpg'))
        .rejects.toThrow('Failed to parse Ollama JSON response');
    });
  });

  describe('Field Presence Validation', () => {
    const createValidAssessment = () => ({
      itemId: '123e4567-e89b-12d3-a456-426614174000',
      productName: 'Test Product',
      grade: 'Good',
      confidenceScore: 85,
      detectedIssues: [],
      transparencyPassport: 'Good condition',
      estimatedResalePrice: 50
    });

    it('should validate all required fields are present', async () => {
      const assessment = createValidAssessment();
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          response: JSON.stringify(assessment),
          done: true
        })
      });

      const result = await analyzeItemImage('test.jpg');
      expect(result).toHaveProperty('itemId');
      expect(result).toHaveProperty('productName');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('confidenceScore');
      expect(result).toHaveProperty('detectedIssues');
      expect(result).toHaveProperty('transparencyPassport');
      expect(result).toHaveProperty('estimatedResalePrice');
    });

    const requiredFields = [
      'itemId',
      'productName',
      'grade',
      'confidenceScore',
      'detectedIssues',
      'transparencyPassport',
      'estimatedResalePrice'
    ];

    requiredFields.forEach(field => {
      it(`should throw error when ${field} is missing`, async () => {
        const assessment = createValidAssessment();
        delete assessment[field];

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            model: 'gemma4:12b-it-qat',
            response: JSON.stringify(assessment),
            done: true
          })
        });

        await expect(analyzeItemImage('test.jpg'))
          .rejects.toThrow(`Missing required field: ${field}`);
      });
    });
  });

  describe('Type Validation', () => {
    it('should validate string types', async () => {
      const assessment = {
        itemId: '123',
        productName: 'Product',
        grade: 'Good',
        confidenceScore: 85,
        detectedIssues: [],
        transparencyPassport: 'Description',
        estimatedResalePrice: 100
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          response: JSON.stringify(assessment),
          done: true
        })
      });

      const result = await analyzeItemImage('test.jpg');
      expect(typeof result.itemId).toBe('string');
      expect(typeof result.productName).toBe('string');
      expect(typeof result.transparencyPassport).toBe('string');
    });

    it('should validate number types', async () => {
      const assessment = {
        itemId: '123',
        productName: 'Product',
        grade: 'Good',
        confidenceScore: 85,
        detectedIssues: [],
        transparencyPassport: 'Description',
        estimatedResalePrice: 100
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          response: JSON.stringify(assessment),
          done: true
        })
      });

      const result = await analyzeItemImage('test.jpg');
      expect(typeof result.confidenceScore).toBe('number');
      expect(typeof result.estimatedResalePrice).toBe('number');
    });

    it('should validate array type for detectedIssues', async () => {
      const assessment = {
        itemId: '123',
        productName: 'Product',
        grade: 'Good',
        confidenceScore: 85,
        detectedIssues: ['scratch', 'dent'],
        transparencyPassport: 'Description',
        estimatedResalePrice: 100
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          response: JSON.stringify(assessment),
          done: true
        })
      });

      const result = await analyzeItemImage('test.jpg');
      expect(Array.isArray(result.detectedIssues)).toBe(true);
    });
  });

  describe('Grade Validation', () => {
    const validGrades = ['Pristine', 'Good', 'Fair', 'Poor'];

    validGrades.forEach(grade => {
      it(`should accept valid grade: ${grade}`, async () => {
        const assessment = {
          itemId: '123',
          productName: 'Product',
          grade: grade,
          confidenceScore: 85,
          detectedIssues: [],
          transparencyPassport: 'Description',
          estimatedResalePrice: 100
        };

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            model: 'gemma4:12b-it-qat',
            response: JSON.stringify(assessment),
            done: true
          })
        });

        const result = await analyzeItemImage('test.jpg');
        expect(result.grade).toBe(grade);
      });
    });

    const invalidGrades = ['Excellent', 'Bad', 'pristine', 'GOOD', 'fair', '', null, undefined];

    invalidGrades.forEach(grade => {
      it(`should reject invalid grade: ${grade}`, async () => {
        const assessment = {
          itemId: '123',
          productName: 'Product',
          grade: grade,
          confidenceScore: 85,
          detectedIssues: [],
          transparencyPassport: 'Description',
          estimatedResalePrice: 100
        };

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            model: 'gemma4:12b-it-qat',
            response: JSON.stringify(assessment),
            done: true
          })
        });

        await expect(analyzeItemImage('test.jpg'))
          .rejects.toThrow(/Invalid grade/);
      });
    });
  });

  describe('Confidence Score Validation', () => {
    const validScores = [0, 1, 50, 99, 100];

    validScores.forEach(score => {
      it(`should accept valid confidence score: ${score}`, async () => {
        const assessment = {
          itemId: '123',
          productName: 'Product',
          grade: 'Good',
          confidenceScore: score,
          detectedIssues: [],
          transparencyPassport: 'Description',
          estimatedResalePrice: 100
        };

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            model: 'gemma4:12b-it-qat',
            response: JSON.stringify(assessment),
            done: true
          })
        });

        const result = await analyzeItemImage('test.jpg');
        expect(result.confidenceScore).toBe(score);
      });
    });

    const invalidScores = [-1, -50, 101, 150, 'not a number', null, undefined, NaN];

    invalidScores.forEach(score => {
      it(`should reject invalid confidence score: ${score}`, async () => {
        const assessment = {
          itemId: '123',
          productName: 'Product',
          grade: 'Good',
          confidenceScore: score,
          detectedIssues: [],
          transparencyPassport: 'Description',
          estimatedResalePrice: 100
        };

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            model: 'gemma4:12b-it-qat',
            response: JSON.stringify(assessment),
            done: true
          })
        });

        await expect(analyzeItemImage('test.jpg'))
          .rejects.toThrow(/Invalid confidenceScore/);
      });
    });
  });

  describe('Detected Issues Array Validation', () => {
    it('should accept empty array for detectedIssues', async () => {
      const assessment = {
        itemId: '123',
        productName: 'Product',
        grade: 'Good',
        confidenceScore: 85,
        detectedIssues: [],
        transparencyPassport: 'Description',
        estimatedResalePrice: 100
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          response: JSON.stringify(assessment),
          done: true
        })
      });

      const result = await analyzeItemImage('test.jpg');
      expect(Array.isArray(result.detectedIssues)).toBe(true);
      expect(result.detectedIssues).toHaveLength(0);
    });

    it('should accept non-empty array for detectedIssues', async () => {
      const issues = ['scratch on side', 'dent on top', 'missing part'];
      const assessment = {
        itemId: '123',
        productName: 'Product',
        grade: 'Fair',
        confidenceScore: 80,
        detectedIssues: issues,
        transparencyPassport: 'Description',
        estimatedResalePrice: 50
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          response: JSON.stringify(assessment),
          done: true
        })
      });

      const result = await analyzeItemImage('test.jpg');
      expect(result.detectedIssues).toEqual(issues);
    });

    const invalidArrayValues = [null, undefined, 'not an array', 123, {}];

    invalidArrayValues.forEach(value => {
      it(`should reject non-array value for detectedIssues: ${value}`, async () => {
        const assessment = {
          itemId: '123',
          productName: 'Product',
          grade: 'Good',
          confidenceScore: 85,
          detectedIssues: value,
          transparencyPassport: 'Description',
          estimatedResalePrice: 100
        };

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            model: 'gemma4:12b-it-qat',
            response: JSON.stringify(assessment),
            done: true
          })
        });

        await expect(analyzeItemImage('test.jpg'))
          .rejects.toThrow(/Invalid detectedIssues: must be an array/);
      });
    });
  });

  describe('Data Immutability - Requirements 7.1, AC5', () => {
    it('should not mutate base64 string input', async () => {
      const originalBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD';
      const inputCopy = originalBase64;
      
      imageUtils.convertToBase64.mockResolvedValue(originalBase64);
      
      const validAssessment = {
        itemId: '123',
        productName: 'Test Product',
        grade: 'Good',
        confidenceScore: 85,
        detectedIssues: [],
        transparencyPassport: 'Good condition',
        estimatedResalePrice: 50
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          response: JSON.stringify(validAssessment),
          done: true
        })
      });

      await analyzeItemImage(originalBase64);
      
      // Verify input string is unchanged
      expect(originalBase64).toBe(inputCopy);
    });

    it('should not mutate File object input', async () => {
      const content = 'test image data';
      const file = new File([content], 'test.jpg', { type: 'image/jpeg' });
      
      // Capture original properties
      const originalName = file.name;
      const originalSize = file.size;
      const originalType = file.type;
      
      imageUtils.convertToBase64.mockResolvedValue(mockBase64Image);
      
      const validAssessment = {
        itemId: '123',
        productName: 'Test Product',
        grade: 'Good',
        confidenceScore: 85,
        detectedIssues: [],
        transparencyPassport: 'Good condition',
        estimatedResalePrice: 50
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          response: JSON.stringify(validAssessment),
          done: true
        })
      });

      await analyzeItemImage(file);
      
      // Verify File object properties are unchanged
      expect(file.name).toBe(originalName);
      expect(file.size).toBe(originalSize);
      expect(file.type).toBe(originalType);
    });

    it('should not mutate Blob object input', async () => {
      const content = 'test blob data';
      const blob = new Blob([content], { type: 'image/png' });
      
      // Capture original properties
      const originalSize = blob.size;
      const originalType = blob.type;
      
      imageUtils.convertToBase64.mockResolvedValue(mockBase64Image);
      
      const validAssessment = {
        itemId: '123',
        productName: 'Test Product',
        grade: 'Good',
        confidenceScore: 85,
        detectedIssues: [],
        transparencyPassport: 'Good condition',
        estimatedResalePrice: 50
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          response: JSON.stringify(validAssessment),
          done: true
        })
      });

      await analyzeItemImage(blob);
      
      // Verify Blob object properties are unchanged
      expect(blob.size).toBe(originalSize);
      expect(blob.type).toBe(originalType);
    });

    it('should be side-effect free for multiple calls with same input', async () => {
      const base64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD';
      
      imageUtils.convertToBase64.mockResolvedValue(base64);
      
      const validAssessment = {
        itemId: '123',
        productName: 'Test Product',
        grade: 'Good',
        confidenceScore: 85,
        detectedIssues: [],
        transparencyPassport: 'Good condition',
        estimatedResalePrice: 50
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          response: JSON.stringify(validAssessment),
          done: true
        })
      });

      // Call multiple times with same input
      await analyzeItemImage(base64);
      await analyzeItemImage(base64);
      await analyzeItemImage(base64);
      
      // Input should remain unchanged
      expect(base64).toBe('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD');
    });

    it('should not alter input data even when API throws error', async () => {
      const base64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD';
      const inputCopy = base64;
      
      imageUtils.convertToBase64.mockResolvedValue(base64);
      
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      try {
        await analyzeItemImage(base64);
      } catch (error) {
        // Expected to throw
      }
      
      // Input should remain unchanged even after error
      expect(base64).toBe(inputCopy);
    });
  });

  describe('Error Handling', () => {
    it('should throw descriptive error on HTTP error response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Service temporarily unavailable'
      });

      await expect(analyzeItemImage('test.jpg'))
        .rejects.toThrow('Ollama API returned error: 500 Internal Server Error - Service temporarily unavailable');
    });

    it('should throw descriptive error on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      await expect(analyzeItemImage('test.jpg'))
        .rejects.toThrow('Failed to connect to Ollama service at http://localhost:11434: Connection refused');
    });

    it('should throw descriptive error on JSON parsing failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Unexpected token'); }
      });

      await expect(analyzeItemImage('test.jpg'))
        .rejects.toThrow('Failed to parse Ollama API response as JSON');
    });

    it('should throw descriptive error when response field is malformed JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          created_at: '2024-01-15T10:30:00.000Z',
          response: '{invalid json}',
          done: true
        })
      });

      await expect(analyzeItemImage('test.jpg'))
        .rejects.toThrow('Failed to parse assessment data from Ollama response');
    });

    it('should throw descriptive error when validation fails', async () => {
      const invalidAssessment = {
        itemId: '123',
        productName: 'Product',
        grade: 'InvalidGrade', // Invalid grade
        confidenceScore: 85,
        detectedIssues: [],
        transparencyPassport: 'Good condition',
        estimatedResalePrice: 50
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gemma4:12b-it-qat',
          created_at: '2024-01-15T10:30:00.000Z',
          response: JSON.stringify(invalidAssessment),
          done: true
        })
      });

      await expect(analyzeItemImage('test.jpg'))
        .rejects.toThrow('Assessment validation failed');
    });

    it('should include context about service availability in network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(analyzeItemImage('test.jpg'))
        .rejects.toThrow('Ensure Ollama is running locally and accessible');
    });

    it('should never return undefined on error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      try {
        const result = await analyzeItemImage('test.jpg');
        // Should not reach here
        expect(result).not.toBeUndefined();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeTruthy();
      }
    });
  });
});
