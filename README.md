# 🔄 Amazon Re-Loop

**AI-Powered Reverse Logistics Platform — Preventing Returns Before They Happen & Optimizing the Ones That Do**

🌐 **Live Demo:** [https://main.d3czfkt4y9vp6h.amplifyapp.com/](https://main.d3czfkt4y9vp6h.amplifyapp.com/)

---

## 🎯 The Problem

Amazon processes **millions of returns daily**, costing billions in logistics, refurbishment, and waste. Two critical gaps exist:

1. **Preventable returns ship anyway** — sizing mismatches and quality issues documented in reviews still result in purchases that get returned
2. **Returns lack intelligent routing** — items go back to centralized warehouses regardless of whether a local buyer exists nearby

## 💡 Our Solution

Amazon Re-Loop is a **full-stack serverless platform** with a 4-layer AI pipeline that closes the full "second life" loop:

| Layer | Function | AWS Service |
|-------|----------|-------------|
| **Prevention** | Warns buyers BEFORE checkout using review intelligence | DynamoDB + Bedrock Nova Micro |
| **Vision Grading** | Analyzes return photos for condition assessment | S3 + Bedrock Nova Lite (multimodal) |
| **Smart Routing** | Condition-aware Net Recovery Value (NRV) engine picks the optimal route | Lambda (Haversine + deterministic math) |
| **Second Life** | Resold items reappear in a "Renewed Nearby" marketplace; customers earn Green Points | React state + Transparency Passport |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     AWS AMPLIFY (React SPA)                        │
│                   React 18 + Vite + React Router                  │
├────────────┬──────────────────────┬──────────────────────────────┤
│  /shop     │      /orders         │         /returns              │
│  Buy +     │   Return Intake      │    History Dashboard          │
│  Renewed   │   (photo upload)     │    + Green Points             │
│  Nearby    │                      │                               │
└─────┬──────┴──────────┬───────────┴──────────────────────────────┘
      │                 │
      ▼                 │   ① POST /upload-urls → Pre-signed S3 URLs
┌───────────┐           │   ② PUT direct to S3 (parallel, no size limit)
│  POST     │           │   ③ POST /return { imageKeys, metadata }
│ /reviews  │           ▼
└─────┬─────┘    ┌──────────────────────────────────────────┐
      │          │          RETURN ORCHESTRATOR LAMBDA        │
      ▼          │                                            │
┌───────────┐    │  1. Fetch images from S3                   │
│ REVIEW    │    │  2. Nova Lite — multimodal VISION GRADING  │
│ INSIGHTS  │    │     (grade + condition-adjusted resale $)  │
│ LAMBDA    │    │  3. Haversine distance → logistics cost    │
│           │    │  4. Condition-aware NRV margin math        │
│ Query     │    │  5. Deterministic routing (highest margin) │
│ DynamoDB  │    └──────────────────────────────────────────┘
│ → Nova    │
│   Micro   │    ┌──────────────────────────────────────────┐
└───────────┘    │              S3 BUCKET                     │
                 │   returns/{sessionId}/image-0.jpg          │
                 │   Permanent audit trail + fraud evidence    │
                 └──────────────────────────────────────────┘

  Routed to P2P/Renewed → item re-lists in "Renewed Nearby" on /shop
  → another customer buys it with a verified Transparency Passport
```

---

## ✨ Key Technical Achievements

### 🛡️ Prevention Layer — Stop Returns Before They Happen
- **DynamoDB** stores 90 product reviews (30 per product)
- **Bedrock Nova Micro** (text-only, sub-second) summarizes the #1 return reason
- Intercepts at checkout: *"~80% of buyers report this runs 1-2 sizes too small"*
- Dedicated microservice Lambda with read-only DynamoDB access

### 📸 Pre-signed S3 Upload Pipeline — Enterprise-Grade Image Handling
- Frontend requests **pre-signed PUT URLs** from a dedicated Lambda
- Images upload **directly to S3** in parallel (bypasses API Gateway's 10MB limit)
- Supports 5 high-resolution photos per return without payload bloat
- Images permanently stored = **tamper-proof photographic audit trail**

### 🤖 Multimodal Vision Grading — Server-Side AI
- Return orchestrator Lambda reads images **from S3** (not base64 payloads)
- **Amazon Bedrock Nova Lite** performs multimodal analysis:
  - Product identification
  - Condition grade (Pristine / Good / Fair / Poor)
  - Confidence score
  - Specific defect detection
  - Transparency passport generation
  - **Condition-adjusted resale value** — the foundation of all routing math

### 📊 Condition-Aware NRV Routing Engine
- **Haversine formula** calculates exact distance (km) between customer and origin FC
- **Dynamic logistics cost**: `distance × $0.05/km`
- The AI's **condition-adjusted resale value (R)** drives every channel — so damage genuinely changes the economics
- Condition-dependent coefficients (more wear → less restock value, more refurb uplift):

  | Channel | Formula |
  |---------|---------|
  | Peer-to-Peer | `R × 0.90` (local sale, 10% fee, no shipping) |
  | Warehouse restock | `R × restockFactor − logistics` (0.95 Pristine → 0.55 Fair) |
  | Refurbishment | `R × refurbUplift − $15 labor` (1.0 Pristine → 1.4 Fair) |

- **Deterministic routing**: the channel with the highest net recovery wins — the decision is always the highest computed margin, fully auditable
- **Poor-grade items** fail the resale quality bar → resale channels disqualified → **Donate / Recycle**
- The AI sees damage; **transparent math** makes the money decision (no black-box LLM routing)

### ♻️ Second-Life Marketplace ("Renewed Nearby")
- Items routed to **P2P Resale** or **Amazon Renewed** automatically re-list on the Shop page
- Each listing shows: condition grade, distance ("📍 4 km away"), discounted price, and the **🔒 Verified Transparency Passport** as a trust badge
- Another customer can **Buy Renewed** → item moves to their Orders and can even be returned again (2nd, 3rd life)
- This closes the full loop the theme demands: *return → grade → route → resold → bought with trust*

### 🍃 Green Credits — Customer Sustainability Incentive
- Each return earns **Green Points** = `carbonSavedKg × 10`
- Surfaced on the return confirmation, the Returns dashboard, and as a running total
- Directly implements the brief's "sustainable incentives and green credits for customers"

### 🔒 Cryptographic Transparency Passport
- Every processed return gets a **SHA-256 digital signature**
- Immutable record: `itemId + grade + timestamp` → 64-char hex hash
- Blockchain-ready audit trail for buyer transparency

### 🍃 Carbon Impact Quantification
- Each routing decision includes CO₂ savings vs landfill:
  - P2P local resale: **3.2 kg** saved (no warehouse shipping)
  - Warehouse restock: 0.8 kg
  - Refurbishment: 1.8 kg
  - Donate/Recycle: 1.2 kg

---

## 🛒 User Flow (Demo Walkthrough)

```
1. SHOP → Browse products → Click "Buy Now"
       → AI Warning Modal (DynamoDB → Nova Micro)
       → "Proceed to Checkout" or Cancel

2. ORDERS → See delivered items → Click "Return Item"
       → Upload 1-5 photos (direct to S3 via pre-signed URLs)
       → Enter return reason → Submit

3. PROCESSING → Lambda fetches images from S3
       → Bedrock Nova Lite (multimodal grading + routing)
       → NRV margin calculations
       → AI executive decision

4. RETURNS → View completed returns (expandable cards)
       → Toggle "Admin View" for NRV margin breakdown
       → Distance, logistics cost, competing margins, routing reasoning
       → Cryptographic signature verification
       → 🌱 Green Points earned

5. SECOND LIFE → Item routed to P2P/Renewed re-lists in "Renewed Nearby" on /shop
       → Another customer buys it with the verified Transparency Passport
       → Loop closes (and can repeat for a 3rd, 4th life)
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, React Router DOM |
| **Hosting** | AWS Amplify (HTTPS, CI/CD) |
| **AI Vision + Routing** | Amazon Bedrock Nova Lite (multimodal) |
| **AI Review Summarization** | Amazon Bedrock Nova Micro (text) |
| **Image Storage** | Amazon S3 (pre-signed URLs, audit trail) |
| **Review Database** | Amazon DynamoDB (PAY_PER_REQUEST) |
| **Compute** | 3× AWS Lambda (Node.js 20, single-responsibility) |
| **API** | AWS API Gateway (REST, CORS) |
| **Infrastructure as Code** | AWS CDK (TypeScript) |
| **Security** | SHA-256 signatures, least-privilege IAM, no client-side secrets |

---

## 📐 Geolocation Data

| Product | Origin Fulfillment Center | Coordinates |
|---------|--------------------------|-------------|
| UrbanFit Essential Tee | Bangalore, KA | 12.97°N, 77.59°E |
| AeroStride Running Sneakers | Chennai, TN | 13.08°N, 80.27°E |
| FreshSeal Storage Box Set | Delhi, DL | 28.70°N, 77.10°E |
| **Customer Location** | **Tirupati, AP** | **13.63°N, 79.42°E** |

---

## 💰 Business Impact

| Metric | Value |
|--------|-------|
| Returns prevented (via AI warnings) | Est. 15-25% reduction |
| Logistics cost savings (P2P vs warehouse) | Up to 60% per item |
| Carbon reduction (local resale) | 3.2 kg CO₂ per P2P route |
| Processing speed | < 5 seconds end-to-end |
| Max image payload | Unlimited (S3 direct upload) |
| Scalability | Fully serverless, auto-scales |
| Customer incentive | Green Points (carbon × 10) per return |

---

## ✅ Theme Coverage — "Second Life Commerce"

| Capability from the brief | Our Implementation |
|---------------------------|--------------------|
| AI decides resell / refurbish / donate / recycle | Condition-aware NRV routing engine (4 routes) ✅ |
| Smart quality grading via image analysis | Bedrock Nova Lite multimodal (1-5 photos) ✅ |
| Easy peer-to-peer resale inside Amazon | "Renewed Nearby" marketplace ✅ |
| Personalized refurbished recommendations | "Renewed Nearby" surfaces nearby certified items ✅ |
| Sustainable incentives / green credits | Green Points per return ✅ |
| Predictive return prevention before purchase | DynamoDB reviews → Nova Micro warning at checkout ✅ |

---

## 📁 Project Structure

```
amazon-reloop/
├── src/
│   ├── pages/
│   │   ├── Shop.jsx            # Product catalog + AI review warnings
│   │   ├── Orders.jsx          # Order history + return intake modal
│   │   └── Returns.jsx         # Read-only return history dashboard
│   ├── services/
│   │   └── api.js              # S3 pre-signed upload + Lambda calls
│   ├── context/
│   │   └── AppContext.jsx      # Global state (orders, returns, admin toggle)
│   ├── App.jsx                 # Router + Navbar + Admin View toggle
│   └── App.css                 # Full styling
├── reloop-backend/
│   ├── backend/index.js        # Return orchestrator (S3 → Nova Lite → NRV)
│   ├── review-insights/index.js # DynamoDB → Nova Micro review summarizer
│   ├── upload-urls/index.js    # Pre-signed S3 URL generator
│   ├── seed-reviews.js         # DynamoDB seeding script (90 reviews)
│   └── lib/reloop-backend-stack.ts  # CDK infrastructure (3 Lambdas, S3, DDB, APIGW)
├── mockReviews.json            # 90 curated reviews (30 per product)
├── amplify.yml                 # Amplify build configuration
└── package.json                # Frontend dependencies
```

---

## 🚀 Deployment

```bash
# Frontend (auto-deploys on git push via Amplify)
git push origin main

# Backend
cd reloop-backend
cdk deploy

# Seed DynamoDB with reviews
node seed-reviews.js
```

---

## 🔑 Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Separate Lambdas** per concern | Least-privilege IAM, independent scaling, fault isolation |
| **S3 pre-signed URLs** instead of base64 | Bypasses 10MB API Gateway limit, enables permanent storage |
| **Nova Micro for text, Nova Lite for vision** | Cost optimization — use smallest model that fits the task |
| **DynamoDB for reviews** | Server-side data access, no secrets in frontend bundle |
| **Haversine + deterministic math** | Auditable, explainable routing (not a black-box LLM decision) |
| **AI grades, math routes** | Nova assesses condition; condition-adjusted margins decide the route — every decision is the highest computed margin, defensible in Q&A |
| **Condition-aware coefficients** | Damage genuinely changes margins; refurbishment only rewarded when there's wear to fix |

---

## 👥 Team

Built for the **Amazon Hackon 6.0 2026**

---

## 📜 License

MIT
