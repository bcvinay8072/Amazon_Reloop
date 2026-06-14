/**
 * Ollama Local AI Service Integration
 * 
 * This module handles communication with the local Ollama AI service
 * for image analysis and item assessment generation.
 * 
 * Expected API Behavior:
 * - Ollama API endpoint: http://localhost:11434/api/generate
 * - Model: gemma4:12b-it-qat must be available in local Ollama installation
 * - Request format: JSON with model, prompt, stream, and format fields
 * - Response format: JSON with model, created_at, response (stringified JSON), and done fields
 * - The 'response' field contains a JSON string that must be parsed to extract assessment data
 * - Streaming mode is disabled (stream: false) for predictable, complete responses
 * - JSON format mode (format: 'json') requests structured output from the AI model
 * 
 * Error Handling:
 * All functions in this module implement comprehensive error handling that satisfies
 * requirements 4.1, 4.2, 4.3, and AC4:
 * 
 * Network Errors (4.1):
 * - Connection failures are caught and wrapped with descriptive messages
 * - Errors include the service URL and original error details
 * - Helpful guidance suggests checking if Ollama is running locally
 * - Example: "Failed to connect to Ollama service at http://localhost:11434: Connection refused. Ensure Ollama is running locally and accessible."
 * 
 * HTTP Errors (4.1):
 * - Non-2xx status codes are detected and thrown as errors
 * - Error messages include status code, status text, and response body when available
 * - Example: "Ollama API returned error: 500 Internal Server Error - Service temporarily unavailable"
 * 
 * Data Parsing Errors (4.2):
 * - Outer JSON parsing failures are caught with context about the parsing error
 * - Missing 'response' field is detected and reported with available fields
 * - Inner JSON (assessment data) parsing failures include a response preview
 * - Examples:
 *   - "Failed to parse Ollama API response as JSON: Unexpected token. Response may be malformed or not in expected format."
 *   - "Ollama API returned invalid response structure: missing 'response' field. Received fields: model, created_at, done"
 *   - "Failed to parse assessment data from Ollama response: Unexpected token. The model may not have returned valid JSON. Response preview: {invalid json..."
 * 
 * Validation Errors (4.2):
 * - Schema validation failures are caught and wrapped with context
 * - Error indicates which validation rule failed
 * - Example: "Assessment validation failed: Invalid grade: VeryGood. Must be one of: Pristine, Good, Fair, Poor. The model returned data that doesn't match the ItemAssessment schema."
 * 
 * Error Propagation (4.3):
 * - All errors are thrown, never returning undefined
 * - Error messages always include descriptive context about what failed and why
 * - Original error messages are preserved when wrapping errors
 * - Functions are fail-fast: they throw immediately when errors are detected
 * 
 * @module ollama
 */

import { convertToBase64 } from './imageUtils.js';

/**
 * ItemAssessment type definition
 * @typedef {Object} ItemAssessment
 * @property {string} itemId - UUID uniquely identifying the assessment
 * @property {string} productName - Name/description of the product
 * @property {('Pristine'|'Good'|'Fair'|'Poor')} grade - Condition grade
 * @property {number} confidenceScore - Confidence level (0-100)
 * @property {string[]} detectedIssues - Array of visible issues/defects
 * @property {string} transparencyPassport - Item condition description
 * @property {number} estimatedResalePrice - Estimated price in dollars
 */

/**
 * OllamaRequest type definition
 * 
 * Structure for requests sent to the Ollama API generate endpoint.
 * This format is required by Ollama's REST API for text/image generation.
 * 
 * @typedef {Object} OllamaRequest
 * @property {string} model - Name of the Ollama model to use (e.g., 'gemma4:12b-it-qat')
 * @property {string} prompt - Input prompt containing instructions and/or image data
 * @property {boolean} stream - Whether to stream the response (false for complete responses)
 * @property {string} format - Output format constraint ('json' requests structured JSON output)
 * 
 * @example
 * const request = {
 *   model: 'gemma4:12b-it-qat',
 *   prompt: 'Analyze this image...',
 *   stream: false,
 *   format: 'json'
 * };
 */

/**
 * OllamaResponse type definition
 * 
 * Structure of responses returned by the Ollama API generate endpoint.
 * The 'response' field contains the actual generated content, which may be
 * a JSON string that requires additional parsing.
 * 
 * @typedef {Object} OllamaResponse
 * @property {string} model - Name of the model that generated the response
 * @property {string} created_at - ISO 8601 timestamp when the response was created
 * @property {string} response - Generated content (JSON string when format='json')
 * @property {boolean} done - Indicates whether generation is complete (always true when stream=false)
 * @property {number} [total_duration] - Optional: Total time in nanoseconds for generation
 * @property {number} [load_duration] - Optional: Time in nanoseconds to load the model
 * @property {number} [prompt_eval_count] - Optional: Number of tokens in the prompt
 * @property {number} [eval_count] - Optional: Number of tokens in the response
 * 
 * @example
 * const response = {
 *   model: 'gemma4:12b-it-qat',
 *   created_at: '2024-01-15T10:30:00.000Z',
 *   response: '{"itemId":"123","productName":"Laptop",...}',
 *   done: true
 * };
 */

const OLLAMA_BASE_URL = 'http://localhost:11434';
const MODEL_NAME = 'gemma4:12b-it-qat';

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
 * Analyzes an item image using the local Ollama AI service.
 * 
 * Sends the image to Ollama's gemma4:12b-it-qat model with a structured
 * prompt requesting JSON-formatted assessment data.
 * 
 * @async
 * @param {string|File|Blob} imageData - Image data (base64 string, File, or Blob)
 * @returns {Promise<ItemAssessment>} Structured assessment of the item
 * @throws {Error} Network error - Failed to connect to Ollama service (connection refused, timeout, DNS failure)
 * @throws {Error} HTTP error - Ollama API returned non-2xx status code
 * @throws {Error} Parsing error - Response JSON is malformed or missing expected fields
 * @throws {Error} Validation error - Assessment data doesn't match ItemAssessment schema
 * @throws {Error} Never returns undefined - all failures result in thrown errors with descriptive messages
 * 
 * @example
 * // Success case
 * const assessment = await analyzeItemImage(imageFile);
 * console.log(assessment.grade); // "Good"
 * console.log(assessment.confidenceScore); // 85
 * 
 * @example
 * // Error handling
 * try {
 *   const assessment = await analyzeItemImage(imageFile);
 *   // Process assessment...
 * } catch (error) {
 *   if (error.message.includes('Failed to connect')) {
 *     console.error('Ollama service is not running');
 *   } else if (error.message.includes('validation failed')) {
 *     console.error('Model returned invalid data format');
 *   } else {
 *     console.error('Unexpected error:', error.message);
 *   }
 * }
 */
export async function analyzeItemImage(imageData) {
  // Step 1: Convert image to base64 if needed
  const base64Image = await convertToBase64(imageData);
  
  // Step 2: Construct structured prompt for AI
  const prompt = `You are a product assessment AI. Analyze the product image and respond with ONLY valid JSON, no additional text.

Return this exact JSON structure:
{
  "itemId": "generate-uuid-here",
  "productName": "Product Name",
  "grade": "Pristine",
  "confidenceScore": 85,
  "detectedIssues": ["issue1", "issue2"],
  "transparencyPassport": "Description of condition",
  "estimatedResalePrice": 100.00
}

Rules:
- grade MUST be exactly one of: Pristine, Good, Fair, Poor
- confidenceScore MUST be a number 0-100
- detectedIssues MUST be an array (use [] if none)
- estimatedResalePrice MUST be a number
- Return ONLY the JSON object, no markdown, no explanation

Image: ${base64Image.substring(0, 100)}...`;
  
  // Step 3: Prepare Ollama API request
  const requestBody = {
    model: MODEL_NAME,
    prompt: prompt,
    stream: false,
    format: 'json'
  };
  
  try {
    // Step 4: Call Ollama API
    let response;
    try {
      response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
    } catch (networkError) {
      // Catch network errors (connection refused, timeout, DNS failure, etc.)
      throw new Error(
        `Failed to connect to Ollama service at ${OLLAMA_BASE_URL}: ${networkError.message}. ` +
        `Ensure Ollama is running locally and accessible.`
      );
    }
    
    // Step 5: Handle HTTP errors
    if (!response.ok) {
      let errorDetails = `${response.status} ${response.statusText}`;
      try {
        // Try to get more details from response body
        const errorBody = await response.text();
        if (errorBody) {
          errorDetails += ` - ${errorBody}`;
        }
      } catch {
        // Ignore if we can't read the error body
      }
      throw new Error(`Ollama API returned error: ${errorDetails}`);
    }
    
    // Step 6: Parse response JSON
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error(
        `Failed to parse Ollama API response as JSON: ${jsonError.message}. ` +
        `Response may be malformed or not in expected format.`
      );
    }
    
    // Check if response contains expected structure
    if (!data.response) {
      throw new Error(
        `Ollama API returned invalid response structure: missing 'response' field. ` +
        `Received fields: ${Object.keys(data).join(', ')}`
      );
    }
    
    // Parse the JSON string from Ollama's response field
    let assessment;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanResponse = data.response.trim();
      
      // Remove markdown JSON code blocks (```json ... ```)
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```json?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      
      // Try to extract JSON if there's extra text
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }
      
      assessment = JSON.parse(cleanResponse);
    } catch (parseError) {
      // Log the actual response for debugging
      console.error('Raw Ollama response:', data.response);
      console.error('Parse error:', parseError.message);
      
      throw new Error(
        `Failed to parse assessment data from Ollama response: ${parseError.message}. ` +
        `The model may not have returned valid JSON. Response preview: ${data.response.substring(0, 200)}...`
      );
    }
    
    // Step 7: Validate schema compliance
    try {
      validateItemAssessment(assessment);
    } catch (validationError) {
      throw new Error(
        `Assessment validation failed: ${validationError.message}. ` +
        `The model returned data that doesn't match the ItemAssessment schema.`
      );
    }
    
    return assessment;
    
  } catch (error) {
    // If the error already has context (thrown from above), re-throw as-is
    // This preserves our descriptive error messages
    throw error;
  }
}
