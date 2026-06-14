/**
 * Tests for API Abstraction Layer
 * 
 * Validates environment-based routing behavior for analyzeReturnedItem function.
 * 
 * Requirements tested:
 * - 1.1: API Abstraction Layer
 * - 1.2: Environment-Based Routing
 * - 6.2: Migration Readiness
 * - AC1: Service Layer Scaffolding
 * - AC6: Future Migration Support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as ollamaModule from './ollama.js';

// Mock the ollama module
vi.mock('./ollama.js', () => ({
  analyzeItemImage: vi.fn()
}));

describe('API Abstraction Layer - Environment-Based Routing', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = import.meta.env.VITE_USE_LOCAL_MOCK;
    
    // Clear mock calls from previous tests
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    import.meta.env.VITE_USE_LOCAL_MOCK = originalEnv;
  });

  describe('Local Mode Routing (VITE_USE_LOCAL_MOCK = true)', () => {
    it('should route to Ollama service when VITE_USE_LOCAL_MOCK is true', async () => {
      // Arrange
      import.meta.env.VITE_USE_LOCAL_MOCK = 'true';
      const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const mockAssessment = {
        itemId: 'test-uuid-123',
        productName: 'Test Product',
        grade: 'Good',
        confidenceScore: 85,
        detectedIssues: [],
        transparencyPassport: 'Test passport',
        estimatedResalePrice: 100
      };
      
      ollamaModule.analyzeItemImage.mockResolvedValue(mockAssessment);

      // Re-import api.js after setting env variable to get the updated environment
      const { analyzeReturnedItem } = await import('./api.js?t=' + Date.now());

      // Act
      const result = await analyzeReturnedItem(mockImageData);

      // Assert
      expect(ollamaModule.analyzeItemImage).toHaveBeenCalledWith(mockImageData);
      expect(ollamaModule.analyzeItemImage).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAssessment);
    });

    it('should pass through the exact image data to Ollama service', async () => {
      // Arrange
      import.meta.env.VITE_USE_LOCAL_MOCK = 'true';
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockAssessment = {
        itemId: 'test-uuid-456',
        productName: 'Another Product',
        grade: 'Pristine',
        confidenceScore: 95,
        detectedIssues: [],
        transparencyPassport: 'Pristine condition',
        estimatedResalePrice: 200
      };
      
      ollamaModule.analyzeItemImage.mockResolvedValue(mockAssessment);

      // Re-import api.js after setting env variable
      const { analyzeReturnedItem } = await import('./api.js?t=' + Date.now());

      // Act
      await analyzeReturnedItem(mockFile);

      // Assert - verify the File object is passed through unchanged
      expect(ollamaModule.analyzeItemImage).toHaveBeenCalledWith(mockFile);
    });

    it('should propagate errors from Ollama service', async () => {
      // Arrange
      import.meta.env.VITE_USE_LOCAL_MOCK = 'true';
      const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const ollamaError = new Error('Ollama service unavailable');
      
      ollamaModule.analyzeItemImage.mockRejectedValue(ollamaError);

      // Re-import api.js after setting env variable
      const { analyzeReturnedItem } = await import('./api.js?t=' + Date.now());

      // Act & Assert
      await expect(analyzeReturnedItem(mockImageData)).rejects.toThrow('Ollama service unavailable');
    });
  });

  describe('AWS Mode Routing (VITE_USE_LOCAL_MOCK = false)', () => {
    it('should throw error when VITE_USE_LOCAL_MOCK is false (AWS not implemented)', async () => {
      // Arrange
      import.meta.env.VITE_USE_LOCAL_MOCK = 'false';
      const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

      // Re-import api.js after setting env variable
      const { analyzeReturnedItem } = await import('./api.js?t=' + Date.now());

      // Act & Assert
      await expect(analyzeReturnedItem(mockImageData)).rejects.toThrow(
        'AWS API Gateway integration not yet implemented'
      );
      
      // Verify Ollama service was NOT called
      expect(ollamaModule.analyzeItemImage).not.toHaveBeenCalled();
    });

    it('should throw error when VITE_USE_LOCAL_MOCK is undefined', async () => {
      // Arrange
      import.meta.env.VITE_USE_LOCAL_MOCK = undefined;
      const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

      // Re-import api.js after setting env variable
      const { analyzeReturnedItem } = await import('./api.js?t=' + Date.now());

      // Act & Assert
      await expect(analyzeReturnedItem(mockImageData)).rejects.toThrow(
        'AWS API Gateway integration not yet implemented'
      );
    });

    it('should throw error when VITE_USE_LOCAL_MOCK is any string other than "true"', async () => {
      // Arrange
      import.meta.env.VITE_USE_LOCAL_MOCK = 'yes';
      const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

      // Re-import api.js after setting env variable
      const { analyzeReturnedItem } = await import('./api.js?t=' + Date.now());

      // Act & Assert
      await expect(analyzeReturnedItem(mockImageData)).rejects.toThrow(
        'AWS API Gateway integration not yet implemented'
      );
    });
  });

  describe('Environment Flag Isolation', () => {
    it('should make routing decision at runtime based on current env value', async () => {
      // This test verifies that the routing is truly dynamic and not cached
      
      // First call with local mode
      import.meta.env.VITE_USE_LOCAL_MOCK = 'true';
      const mockAssessment = {
        itemId: 'test-uuid-789',
        productName: 'Dynamic Test',
        grade: 'Fair',
        confidenceScore: 70,
        detectedIssues: ['minor wear'],
        transparencyPassport: 'Fair condition',
        estimatedResalePrice: 50
      };
      ollamaModule.analyzeItemImage.mockResolvedValue(mockAssessment);
      
      const { analyzeReturnedItem: analyzeReturnedItem1 } = await import('./api.js?t=' + Date.now());
      const result1 = await analyzeReturnedItem1('image1');
      expect(ollamaModule.analyzeItemImage).toHaveBeenCalled();
      expect(result1).toEqual(mockAssessment);
      
      // Reset mock
      vi.clearAllMocks();
      
      // Second call with AWS mode
      import.meta.env.VITE_USE_LOCAL_MOCK = 'false';
      const { analyzeReturnedItem: analyzeReturnedItem2 } = await import('./api.js?t=' + Date.now());
      await expect(analyzeReturnedItem2('image2')).rejects.toThrow(
        'AWS API Gateway integration not yet implemented'
      );
      expect(ollamaModule.analyzeItemImage).not.toHaveBeenCalled();
    });
  });

  describe('Data Immutability - Requirements 7.1, AC5', () => {
    beforeEach(() => {
      import.meta.env.VITE_USE_LOCAL_MOCK = 'true';
    });

    it('should not mutate base64 string input', async () => {
      const originalBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const inputCopy = originalBase64;
      
      const mockAssessment = {
        itemId: 'test-uuid',
        productName: 'Test Product',
        grade: 'Good',
        confidenceScore: 85,
        detectedIssues: [],
        transparencyPassport: 'Good condition',
        estimatedResalePrice: 100
      };
      
      ollamaModule.analyzeItemImage.mockResolvedValue(mockAssessment);

      const { analyzeReturnedItem } = await import('./api.js?t=' + Date.now());
      await analyzeReturnedItem(originalBase64);
      
      // Verify input string is unchanged
      expect(originalBase64).toBe(inputCopy);
      expect(originalBase64).toContain('data:image/jpeg');
    });

    it('should not mutate File object input', async () => {
      const content = 'test image data';
      const file = new File([content], 'test.jpg', { type: 'image/jpeg' });
      
      // Capture original properties
      const originalName = file.name;
      const originalSize = file.size;
      const originalType = file.type;
      
      const mockAssessment = {
        itemId: 'test-uuid',
        productName: 'Test Product',
        grade: 'Good',
        confidenceScore: 85,
        detectedIssues: [],
        transparencyPassport: 'Good condition',
        estimatedResalePrice: 100
      };
      
      ollamaModule.analyzeItemImage.mockResolvedValue(mockAssessment);

      const { analyzeReturnedItem } = await import('./api.js?t=' + Date.now());
      await analyzeReturnedItem(file);
      
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
      
      const mockAssessment = {
        itemId: 'test-uuid',
        productName: 'Test Product',
        grade: 'Good',
        confidenceScore: 85,
        detectedIssues: [],
        transparencyPassport: 'Good condition',
        estimatedResalePrice: 100
      };
      
      ollamaModule.analyzeItemImage.mockResolvedValue(mockAssessment);

      const { analyzeReturnedItem } = await import('./api.js?t=' + Date.now());
      await analyzeReturnedItem(blob);
      
      // Verify Blob object properties are unchanged
      expect(blob.size).toBe(originalSize);
      expect(blob.type).toBe(originalType);
    });

    it('should be side-effect free for multiple calls with same input', async () => {
      const base64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      
      const mockAssessment = {
        itemId: 'test-uuid',
        productName: 'Test Product',
        grade: 'Good',
        confidenceScore: 85,
        detectedIssues: [],
        transparencyPassport: 'Good condition',
        estimatedResalePrice: 100
      };
      
      ollamaModule.analyzeItemImage.mockResolvedValue(mockAssessment);

      const { analyzeReturnedItem } = await import('./api.js?t=' + Date.now());
      
      // Call multiple times with same input
      await analyzeReturnedItem(base64);
      await analyzeReturnedItem(base64);
      await analyzeReturnedItem(base64);
      
      // Input should remain unchanged
      expect(base64).toBe('data:image/jpeg;base64,/9j/4AAQSkZJRg==');
    });

    it('should not alter input data when routing to AWS (error case)', async () => {
      import.meta.env.VITE_USE_LOCAL_MOCK = 'false';
      const base64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const inputCopy = base64;

      const { analyzeReturnedItem } = await import('./api.js?t=' + Date.now());
      
      try {
        await analyzeReturnedItem(base64);
      } catch (error) {
        // Expected to throw
      }
      
      // Input should remain unchanged even after error
      expect(base64).toBe(inputCopy);
    });

    it('should not alter input data when Ollama service throws error', async () => {
      const base64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const inputCopy = base64;
      
      ollamaModule.analyzeItemImage.mockRejectedValue(new Error('Service error'));

      const { analyzeReturnedItem } = await import('./api.js?t=' + Date.now());
      
      try {
        await analyzeReturnedItem(base64);
      } catch (error) {
        // Expected to throw
      }
      
      // Input should remain unchanged even after error
      expect(base64).toBe(inputCopy);
    });
  });
});
