# 🔄 Amazon Re-Loop

**AI-Powered Reverse Logistics Platform — Preventing Returns Before They Happen & Optimizing the Ones That Do**

🌐 **Live Demo:** [https://main.d3czfkt4y9vp6h.amplifyapp.com/](https://main.d3czfkt4y9vp6h.amplifyapp.com/)

---

## 🎯 Problem Statement

Amazon processes **millions of returns daily**, costing billions in logistics, refurbishment, and waste. Most returns are preventable (sizing issues, misleading descriptions), and those that aren't lack intelligent routing — items get sent back to centralized warehouses regardless of whether a local buyer exists 5 km away.

## 💡 Our Solution

**Amazon Re-Loop** is a full-stack reverse logistics platform that:

1. **Prevents returns before checkout** — AI analyzes 30+ product reviews in real-time and warns buyers about the #1 return reason before purchase
2. **Grades returned items using multimodal AI** — Amazon Bedrock Nova Lite analyzes product photos to assess condition
3. **Routes returns using deterministic math + AI** — A Net Recovery Value (NRV) engine calculates optimal margins, then an AI executive makes the final routing decision
4. **Reduces carbon footprint** — Peer-to-peer local resale avoids warehouse shipping entirely

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AWS AMPLIFY (Frontend)                 │
│                     React + Vite SPA                      │
├─────────────┬──────────────────┬────────────────────────┤
│   /shop     │     /orders      │       /returns          │
│  AI Review  │  Return Modal    │   History Dashboard     │
│  Warnings   │  Image Upload    │   Admin NRV View        │
└──────┬──────┴────────┬─────────┴────────────────────────┘
       │               │
       ▼               ▼
┌─────────────┐  ┌──────────────────────────────────────┐
│  Groq API   │  │     AWS API GATEWAY + LAMBDA          │
│  (Reviews)  │  │                                        │
│  Llama 4    │  │  1. Haversine Distance Calculation     │
│  Scout      │  │  2. NRV Margin Math Engine             │
└─────────────┘  │  3. Amazon Bedrock Nova Lite           │
                 │     (Multimodal Vision + Routing)       │
                 └──────────────────────────────────────┘
```

---

## ✨ Key Features

### 🛡️ Component 1: Prevention Before Cure
- LLM analyzes **30 real product reviews** per item at checkout
- Warns buyers: *"~90% of reviewers report this runs 1-2 sizes too small"*
- Uses OpenAI SDK with AIPipe proxy + Groq fallback
- **Impact**: Prevents returns before they happen

### 📸 Component 2: Multimodal Visual Grading
- Customer uploads **1-5 product photos** during return
- Images sent as base64 to AWS Lambda
- **Amazon Bedrock Nova Lite** performs server-side multimodal analysis
- Returns: product identification, condition grade (Pristine/Good/Fair/Poor), confidence score, detected issues

### 📊 Component 3: Deterministic NRV Routing Engine
- **Haversine formula** calculates exact distance (km) from customer to origin fulfillment center
- **Dynamic logistics cost**: `distance × $0.05/km`
- Calculates three competing margins:
  - `marginWarehouse = resalePrice × 0.60 - logisticsCost`
  - `marginP2P = resalePrice × 0.75`
  - `marginRefurbish = originalPrice × 0.45 - (logisticsCost × 0.5)`

### 🤖 Component 4: Hybrid AI Executive Decision
- After math calculates margins, **Bedrock Nova Lite** makes the final routing call
- Considers both visual condition AND financial margins
- Routes: `PEER_TO_PEER_RESALE` | `RESTOCK_MAIN_WAREHOUSE` | `AMAZON_RENEWED` | `DONATE_RECYCLE`

### 🔒 Component 5: Cryptographic Transparency Passport
- Every return gets a **SHA-256 digital signature**
- Immutable record combining itemId + grade + timestamp
- Provides blockchain-ready audit trail for buyers

### 🍃 Component 6: Carbon Impact Tracking
- Each routing decision includes estimated CO₂ savings
- P2P local resale saves **3.2 kg** (no warehouse shipping)
- Warehouse return: 0.8 kg | Refurbish: 1.8 kg | Recycle: 1.2 kg

---

## 🛒 User Flow

```
1. SHOP → Browse 3 products → Click "Buy Now"
   ↓
2. AI WARNING MODAL → LLM summarizes top return reason from reviews
   ↓
3. PROCEED → Order added to "My Orders" (Delivered)
   ↓
4. RETURN → Click "Return Item" → Upload photos + reason
   ↓
5. PROCESSING → Images → AWS Lambda → Bedrock Nova (multimodal)
   ↓
6. RESULT → Grade, Route, Margins, Carbon Saved, Crypto Signature
   ↓
7. RETURNS PAGE → Full history with expandable details
   ↓
   (Toggle "Admin View" to see NRV margin breakdown)
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, React Router DOM |
| **Hosting** | AWS Amplify |
| **AI (Vision + Routing)** | Amazon Bedrock — Nova Lite (multimodal) |
| **AI (Review Analysis)** | Groq Llama 4 Scout via OpenAI SDK |
| **Backend** | AWS Lambda (Node.js 18) |
| **API** | AWS API Gateway (REST) |
| **IaC** | AWS CDK (TypeScript) |
| **Math Engine** | Custom Haversine + NRV margin calculator |
| **Security** | SHA-256 cryptographic signatures |

---

## 📐 Geolocation Data

| Product | Origin Fulfillment Center | Coordinates |
|---------|--------------------------|-------------|
| UrbanFit Tee | Bangalore | 12.9716°N, 77.5946°E |
| AeroStride Sneakers | Chennai | 13.0827°N, 80.2707°E |
| FreshSeal Storage | Delhi | 28.7041°N, 77.1025°E |
| **Customer** | **Tirupati** | **13.6288°N, 79.4192°E** |

---

## 🚀 Quick Start (Local Development)

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/amazon-reloop.git
cd amazon-reloop

# Install
npm install

# Configure environment
cp .env.example .env
# Add your API keys to .env

# Run
npm run dev
```

---

## 📁 Project Structure

```
amazon-reloop/
├── src/
│   ├── pages/
│   │   ├── Shop.jsx          # Product catalog + AI review warnings
│   │   ├── Orders.jsx        # Order history + return modal (upload + analysis)
│   │   └── Returns.jsx       # Read-only return history dashboard
│   ├── services/
│   │   └── api.js            # Thin client → AWS Lambda
│   ├── context/
│   │   └── AppContext.jsx    # Global state (orders, returns, adminView)
│   ├── App.jsx               # Router + Navbar + Admin toggle
│   └── App.css               # Full styling
├── reloop-backend/
│   ├── backend/
│   │   └── index.js          # Lambda: Haversine + NRV + Bedrock Nova
│   └── lib/
│       └── reloop-backend-stack.ts  # CDK infrastructure
├── mockReviews.json          # 90 reviews (30 per product)
├── amplify.yml               # Amplify build config
└── package.json
```

---

## 💰 Business Impact

| Metric | Value |
|--------|-------|
| **Returns prevented** (via AI warnings) | Est. 15-25% reduction |
| **Logistics cost savings** (P2P vs warehouse) | Up to 60% per item |
| **Carbon reduction** (local resale) | 3.2 kg CO₂ per P2P route |
| **Processing speed** | < 5 seconds end-to-end |
| **Scalability** | Serverless — auto-scales to millions |

---

## 👥 Team

Built for the **Amazon Hackon 6.0 2026**

---

## 📜 License

MIT
