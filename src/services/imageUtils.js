/**
 * Image Utility Functions
 * 
 * This module provides utilities for image data conversion and manipulation,
 * supporting various input formats for the Amazon Re-Loop service.
 */

/**
 * Converts various image data formats to base64 string.
 * 
 * Handles:
 * - Base64 strings (with or without data URL prefix)
 * - File objects from file inputs
 * - Blob objects from various sources
 * 
 * For data URLs (data:image/...;base64,...), extracts the base64 portion.
 * For File/Blob objects, converts them to base64 using FileReader.
 * 
 * @async
 * @param {string|File|Blob} imageData - Image data to convert
 * @returns {Promise<string>} Base64-encoded image string (without data URL prefix for raw base64)
 * @throws {Error} If imageData is null, undefined, or invalid type
 * @throws {Error} If FileReader fails during conversion
 * 
 * @example
 * // With data URL string
 * const base64 = await convertToBase64('data:image/jpeg;base64,/9j/4AAQ...');
 * // Returns: '/9j/4AAQ...' (extracted base64)
 * 
 * @example
 * // With File object
 * const base64 = await convertToBase64(fileInput.files[0]);
 * // Returns: 'data:image/jpeg;base64,/9j/4AAQ...' (full data URL)
 * 
 * @example
 * // With plain base64 string
 * const base64 = await convertToBase64('/9j/4AAQ...');
 * // Returns: '/9j/4AAQ...' (unchanged)
 */
export async function convertToBase64(imageData) {
  // Validate input is not null or undefined
  if (imageData == null) {
    throw new Error('Image data cannot be null or undefined');
  }
  
  // Handle string input (base64 or data URL)
  if (typeof imageData === 'string') {
    // Validate non-empty string
    if (imageData.trim().length === 0) {
      throw new Error('Image data string cannot be empty');
    }
    
    // Check if it's a data URL (data:image/...;base64,...)
    const dataUrlMatch = imageData.match(/^data:image\/[a-zA-Z+]+;base64,(.+)$/);
    if (dataUrlMatch) {
      // Extract and return the base64 portion
      const base64Data = dataUrlMatch[1];
      if (base64Data.length === 0) {
        throw new Error('Data URL contains empty base64 data');
      }
      return base64Data;
    }
    
    // Return plain base64 string as-is
    return imageData;
  }
  
  // Handle File or Blob input
  if (imageData instanceof File || imageData instanceof Blob) {
    // Validate file size (check it's not empty)
    if (imageData.size === 0) {
      throw new Error('Image file/blob is empty (0 bytes)');
    }
    
    // Convert to base64 using FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const result = reader.result;
        if (!result) {
          reject(new Error('FileReader returned empty result'));
          return;
        }
        resolve(result);
      };
      
      reader.onerror = () => {
        const errorMsg = reader.error ? reader.error.message : 'Unknown FileReader error';
        reject(new Error(`Failed to read image file: ${errorMsg}`));
      };
      
      reader.onabort = () => {
        reject(new Error('Image file reading was aborted'));
      };
      
      reader.readAsDataURL(imageData);
    });
  }
  
  // Invalid type
  throw new Error(
    `Invalid image data type: ${typeof imageData}. ` +
    'Expected string (base64/data URL), File, or Blob'
  );
}
