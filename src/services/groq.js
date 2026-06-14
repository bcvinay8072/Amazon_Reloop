/**
 * Groq Cloud AI Service Integration
 * 
 * This module handles communication with Groq's cloud AI service
 * for image analysis and item assessment generation.
 * 
 * Groq provides fast, cloud-based inference with vision models
 * and guaranteed JSON output format.
 */

import { convertToBase64 } from './imageUtils.js';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * ItemAssessment type definition (Vision-only output from Groq)
 * @typedef {Object} VisionAssessment
 * @property {string} itemId - UUID uniquely identifying the assessment
 * @property {string} productName - Name/description of the product
 * @property {('Pristine'|'Good'|'Fair'|'Poor')} grade - Condition grade
 * @property {number} confidenceScore - Confidence level (0-100)
 * @property {string[]} detectedIssues - Array of visible issues/defects
 * @property {string} transparencyPassport - Item condition description
 * @property {number} estimatedResalePrice - Estimated price in dollars
 */

/**
 * Generates a UUID v4
 * @private
 * @returns {string} UUID string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validates that an assessment object matches the ItemAssessment schema.
 * 
 * @private
 * @param {Object} assessment - Assessment object to validate
 * @throws {Error} If validation fails
 */
function validateItemAssessment(assessment) {
  const requiredFields = [
    'itemId',
    'productName',
    'grade',
    'confidenceScore',
    'detectedIssues',
    'transparencyPassport',
    'estimatedResalePrice'
  ];
  
  // Check all required fields are present
  for (const field of requiredFields) {
    if (!(field in assessment)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate grade is one of allowed values
  const validGrades = ['Pristine', 'Good', 'Fair', 'Poor'];
  if (!validGrades.includes(assessment.grade)) {
    throw new Error(`Invalid grade: ${assessment.grade}. Must be one of: ${validGrades.join(', ')}`);
  }
  
  // Validate confidence score is in range
  if (typeof assessment.confidenceScore !== 'number' || 
      assessment.confidenceScore < 0 || 
      assessment.confidenceScore > 100) {
    throw new Error(`Invalid confidenceScore: ${assessment.confidenceScore}. Must be between 0 and 100`);
  }
  
  // Validate detectedIssues is an array
  if (!Array.isArray(assessment.detectedIssues)) {
    throw new Error(`Invalid detectedIssues: must be an array`);
  }
}

/**
 * Analyzes an item image using Groq's cloud AI service.
 * 
 * Sends the image(s) to Groq's Llama 4 Scout vision model with structured
 * prompt requesting JSON-formatted assessment data.
 * 
 * @async
 * @param {string|File|Blob|Array} imageData - Single image or array of images (max 5)
 * @returns {Promise<VisionAssessment>} Visual grading assessment only
 * @throws {Error} If Groq API key is missing
 * @throws {Error} If API call fails or returns invalid data
 */
export async function analyzeItemImage(imageData) {
  // Step 1: Check for API key
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Groq API key not found. Please set VITE_GROQ_API_KEY in your .env file. ' +
      'Get your free API key at: https://console.groq.com/keys'
    );
  }
  
  // Step 2: Handle single or multiple images (max 5)
  const images = Array.isArray(imageData) ? imageData.slice(0, 5) : [imageData];
  
  // Step 3: Convert all images to base64 data URLs
  const base64Images = await Promise.all(
    images.map(async (img) => {
      let base64 = await convertToBase64(img);
      // Ensure it's a data URL format (Groq expects data:image/...;base64,...)
      if (!base64.startsWith('data:')) {
        base64 = `data:image/jpeg;base64,${base64}`;
      }
      return base64;
    })
  );
  
  // Step 4: Construct structured prompt (Visual Grading ONLY)
  const systemPrompt = `You are a product condition assessment AI for returned items. Your ONLY job is visual grading. Analyze product images and provide detailed condition assessments.

Return ONLY valid JSON with this exact structure:
{
  "itemId": "uuid-here",
  "productName": "Product Name",
  "grade": "Pristine|Good|Fair|Poor",
  "confidenceScore": 85,
  "detectedIssues": ["issue1", "issue2"],
  "transparencyPassport": "Detailed condition description",
  "estimatedResalePrice": 100.00
}

Rules:
- itemId: Generate a valid UUID
- productName: Identify the exact product
- grade: MUST be exactly one of: Pristine, Good, Fair, Poor
  * Pristine: Like new, no visible wear
  * Good: Minor wear, fully functional
  * Fair: Noticeable wear but functional
  * Poor: Significant damage or defects
- confidenceScore: Number 0-100 based on image quality
- detectedIssues: Array of specific issues (empty array if none)
- transparencyPassport: Honest description of condition for buyers
- estimatedResalePrice: Realistic USD price based on condition`;

  const userPrompt = images.length > 1 
    ? `Analyze these ${images.length} images of the same returned product from different angles and provide a single comprehensive condition assessment following the JSON structure.`
    : 'Analyze this returned product image and provide a detailed condition assessment following the JSON structure.';
  
  // Step 5: Build content array with text + all images
  const contentArray = [
    {
      type: 'text',
      text: userPrompt
    },
    ...base64Images.map(url => ({
      type: 'image_url',
      image_url: { url }
    }))
  ];
  
  // Step 6: Prepare Groq API request
  const requestBody = {
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: contentArray
      }
    ],
    temperature: 0.3,
    max_completion_tokens: 1024,
    top_p: 0.9,
    response_format: { type: 'json_object' },
    stream: false
  };
  
  try {
    // Step 7: Call Groq API
    const response = await fetch(GROQ_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Step 8: Handle HTTP errors
    if (!response.ok) {
      let errorMessage = `Groq API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage += ` - ${errorData.error.message || JSON.stringify(errorData.error)}`;
        }
      } catch {
        // Ignore if we can't parse error body
      }
      throw new Error(errorMessage);
    }
    
    // Step 9: Parse response
    const data = await response.json();
    
    // Check response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Groq API returned invalid response structure');
    }
    
    const content = data.choices[0].message.content;
    
    // Step 10: Parse JSON from response
    let assessment;
    try {
      assessment = JSON.parse(content);
    } catch (parseError) {
      console.error('Raw Groq response:', content);
      throw new Error(
        `Failed to parse Groq response as JSON: ${parseError.message}. ` +
        `Response: ${content.substring(0, 200)}...`
      );
    }
    
    // Step 11: Ensure UUID is present (generate if missing)
    if (!assessment.itemId || assessment.itemId.includes('uuid')) {
      assessment.itemId = generateUUID();
    }
    
    // Step 12: Validate schema compliance
    validateItemAssessment(assessment);
    
    return assessment;
    
  } catch (error) {
    // Add helpful context for common errors
    if (error.message.includes('401')) {
      throw new Error(
        'Invalid Groq API key. Please check your VITE_GROQ_API_KEY in .env file. ' +
        'Get a free API key at: https://console.groq.com/keys'
      );
    }
    
    if (error.message.includes('429')) {
      throw new Error(
        'Groq API rate limit exceeded. Please wait a moment and try again. ' +
        'Free tier allows 30 requests/minute.'
      );
    }
    
    if (error.message.includes('fetch')) {
      throw new Error(
        `Failed to connect to Groq API: ${error.message}. ` +
        'Check your internet connection.'
      );
    }
    
    // Re-throw with context preserved
    throw error;
  }
}
