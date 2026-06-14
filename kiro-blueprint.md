# Project Blueprint: Amazon Re-Loop (HackOn 6.0)

## Overview
We are building "Amazon Re-Loop," an AI-powered Second Life Commerce platform for Amazon returns. The application assesses returned items via AI, grades their condition, generates a "Transparency Passport" (condition report), and routes them to a second-hand storefront. 

## Development Philosophy: Mock-to-Cloud Strategy
We are in a 48-hour hackathon. To ensure zero blockers, we are building a **local-first** application using a Strict Service Layer. 
* **Phase 1 (Current):** Local mock environment. React frontend connects to a local AI endpoint via Ollama (`gemma4:12b-it-qat`) to simulate AWS Bedrock vision capabilities.
* **Phase 2 (Future):** The local Ollama calls and mock data will be swapped for real AWS Serverless API endpoints (API Gateway, Lambda, S3, DynamoDB, AWS Bedrock with Claude Sonnet).

**CRITICAL:** UI components must NEVER contain hardcoded API calls. All data fetching must happen through the `src/services/api.js` abstraction layer.

## Tech Stack
* **Frontend:** React (Vite), Tailwind CSS, Lucide React (for icons)
* **Local AI:** Ollama API (`http://localhost:11434`) running `gemma4:12b-it-qat`
* **Future Cloud:** AWS (S3, API Gateway, Lambda, DynamoDB, Bedrock)

## Expected Data Contracts (JSON)
When the AI (Local or AWS) evaluates an item, it MUST return data strictly matching this schema:

```json
{
  "itemId": "uuid-string",
  "productName": "String (e.g., Echo Dot 5th Gen)",
  "grade": "String (Pristine, Good, Fair, Poor)",
  "confidenceScore": "Number (0-100)",
  "detectedIssues": ["Array of Strings"],
  "transparencyPassport": "String (Short, customer-facing paragraph explaining the condition)",
  "estimatedResalePrice": "Number"
}
```

## Target Folder Structure
/src
  /components
    /layout       (Navbar, Sidebar)
    /intake       (ImageUpload, ReturnForm)
    /storefront   (MarketplaceGrid, HealthCard)
  /services
    api.js        (The strict Mock-to-Cloud abstraction layer)
    ollama.js     (Local LLM fetch logic)
  /pages
    SellerApp.jsx (Phase 1: Product Intake & Assessment)
    BuyerApp.jsx  (Phase 3: Resale Marketplace)
