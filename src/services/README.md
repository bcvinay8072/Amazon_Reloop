# Amazon Re-Loop Service Layer

This directory contains the service layer modules for the Amazon Re-Loop application. The service layer provides abstraction between the UI and backend services, with support for local AI processing and future cloud migration.

## Modules

### `api.js`
**Purpose:** Main API abstraction layer  
**Exports:** `analyzeReturnedItem(imageData)`

The primary interface for item analysis. Routes requests based on environment configuration:
- Local mode (`VITE_USE_LOCAL_MOCK=true`): Uses local Ollama service
- Cloud mode (`VITE_USE_LOCAL_MOCK=false`): Reserved for AWS API Gateway (future)

**Usage:**
```javascript
import { analyzeReturnedItem } from './services/api';

const assessment = await analyzeReturnedItem(imageFile);
console.log(assessment.grade); // "Good"
console.log(assessment.confidenceScore); // 85
```

### `ollama.js`
**Purpose:** Local Ollama AI service integration  
**Exports:** `analyzeItemImage(imageData)`

Communicates with local Ollama service to generate item assessments using the `gemma4:12b-it-qat` model. Handles:
- Structured prompt generation
- JSON response parsing
- Schema validation
- Error handling

**Usage:**
```javascript
import { analyzeItemImage } from './services/ollama';

const assessment = await analyzeItemImage(imageFile);
// Returns ItemAssessment object
```

### `imageUtils.js`
**Purpose:** Image data conversion utilities  
**Exports:** `convertToBase64(imageData)`

Converts various image formats to base64 strings for API processing. Handles:
- Base64 strings (plain or with data URL prefix)
- File objects from file inputs
- Blob objects
- Data URL parsing (extracts base64 from `data:image/...;base64,...`)
- Comprehensive error handling

**Usage:**
```javascript
import { convertToBase64 } from './services/imageUtils';

// Extract base64 from data URL
const base64 = await convertToBase64('data:image/jpeg;base64,/9j/4AAQ...');
// Returns: '/9j/4AAQ...'

// Convert File to data URL
const dataUrl = await convertToBase64(fileInput.files[0]);
// Returns: 'data:image/jpeg;base64,/9j/4AAQ...'

// Plain base64 passes through
const plain = await convertToBase64('/9j/4AAQ...');
// Returns: '/9j/4AAQ...'
```

## Data Types

### ItemAssessment
```javascript
{
  itemId: string,              // UUID
  productName: string,          // Product identifier
  grade: string,                // "Pristine" | "Good" | "Fair" | "Poor"
  confidenceScore: number,      // 0-100
  detectedIssues: string[],     // Array of issues (may be empty)
  transparencyPassport: string, // Condition description
  estimatedResalePrice: number  // USD dollars
}
```

## Environment Configuration

- `VITE_USE_LOCAL_MOCK=true` - Use local Ollama service
- `VITE_USE_LOCAL_MOCK=false` - Use AWS API Gateway (future)

## Dependencies

### Local Development
- Ollama must be installed and running on `localhost:11434`
- Model `gemma4:12b-it-qat` must be available in Ollama

### Future Production
- AWS API Gateway endpoint (to be configured)
- AWS Lambda functions for processing
- AWS Bedrock for AI vision capabilities

## Error Handling

All service functions throw descriptive errors with context:
- Network failures include connection details
- Parsing errors include the failed content
- Validation errors specify which field failed
- No function returns `undefined` on error

## Testing

Unit tests are located in `*.test.js` files alongside source files:
- `imageUtils.test.js` - Tests for image conversion utilities

To run tests (requires Vitest setup):
```bash
npm run test
```
