# 🔄 Amazon Re-Loop

AI-powered assessment system for returned product items, enabling circular economy and sustainable resale operations.

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)

2. **Choose Your AI Service:**

   **Option A: Groq Cloud (Recommended ⭐)**
   - ✅ Fast (2-5 seconds)
   - ✅ No hardware requirements
   - ✅ Perfect JSON output
   - ✅ Free tier available
   - Get API key: https://console.groq.com/keys
   - See `GROQ_SETUP.md` for detailed setup

   **Option B: Local Ollama**
   - ⚠️ Requires 8GB+ RAM
   - ⚠️ Slower (30+ seconds)
   - ⚠️ May have JSON issues
   - Download from: https://ollama.ai/download

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure AI Service:**

   **For Groq (Recommended):**
   ```bash
   # Edit .env file and add your Groq API key:
   VITE_AI_SERVICE=groq
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```
   Get your free API key at: https://console.groq.com/keys
   
   See `GROQ_SETUP.md` for detailed instructions.

   **For Local Ollama:**
   ```bash
   # Install Ollama and pull model
   ollama pull gemma4:12b-it-qat
   
   # Edit .env file:
   VITE_AI_SERVICE=ollama
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - The app will automatically open at `http://localhost:3000`
   - Or manually navigate to the URL shown in your terminal

## 📸 How to Use

1. **Upload an Image**
   - Click "Choose Image" button
   - Select a photo of a returned product
   - Preview will appear

2. **Analyze the Item**
   - Click "Analyze Item" button
   - Wait for AI assessment (typically 5-30 seconds)

3. **View Results**
   - Condition Grade (Pristine/Good/Fair/Poor)
   - Confidence Score (0-100%)
   - Estimated Resale Price
   - Detected Issues
   - Transparency Passport

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **AI Service:** Ollama (local) with gemma4:12b-it-qat
- **Styling:** Pure CSS (no framework)
- **Testing:** Vitest

## 📁 Project Structure

```
amazon-reloop/
├── src/
│   ├── services/
│   │   ├── api.js              # API abstraction layer
│   │   ├── ollama.js           # Ollama integration
│   │   └── imageUtils.js       # Image conversion utilities
│   ├── App.jsx                 # Main application component
│   ├── main.jsx                # React entry point
│   ├── App.css                 # Application styles
│   └── index.css               # Global styles
├── .env                        # Environment configuration
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies
└── index.html                  # HTML entry point
```

## 🧪 Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui
```

## ⚙️ Configuration

Edit `.env` to configure the service:

```env
# Use local Ollama service
VITE_USE_LOCAL_MOCK=true

# Future: Use AWS API Gateway (not yet implemented)
# VITE_USE_LOCAL_MOCK=false
```

## 🔧 Troubleshooting

### "Ollama service unavailable" error

**Solution:**
1. Make sure Ollama is installed and running:
   ```bash
   ollama serve
   ```
2. Verify the model is available:
   ```bash
   ollama list
   ```
3. If model is missing, pull it:
   ```bash
   ollama pull gemma4:12b-it-qat
   ```

### "Failed to connect to Ollama service" error

**Solution:**
- Ollama must be running on `http://localhost:11434`
- Check if another service is using port 11434
- Restart Ollama service

### Slow analysis times

**Solution:**
- First run is slower (model loading)
- Subsequent runs are faster
- Smaller images process faster
- Consider using a more powerful CPU/GPU

## 🎯 Features

### Current (Phase 1)
✅ Local-first architecture (no cloud required)  
✅ Multi-format image support (File, Blob, base64)  
✅ Real-time AI assessment  
✅ Confidence scoring  
✅ Issue detection  
✅ Price estimation  
✅ Responsive UI  

### Coming Soon (Phase 2)
🔜 AWS API Gateway integration  
🔜 AWS Bedrock (Claude Sonnet) for production  
🔜 Assessment history  
🔜 Multi-user support  
🔜 Camera capture  
🔜 Batch processing  

## 📊 Assessment Schema

```javascript
{
  itemId: "uuid-string",
  productName: "iPhone 14 Pro",
  grade: "Good", // Pristine | Good | Fair | Poor
  confidenceScore: 85, // 0-100
  detectedIssues: ["Minor screen scratches"],
  transparencyPassport: "Item condition description...",
  estimatedResalePrice: 599.99
}
```

## 🤝 Contributing

This is a hackathon project (48-hour development window). Contributions welcome!

## 📝 License

MIT License - see LICENSE file for details

## 🎉 Acknowledgments

- Built for Amazon Hackathon
- AI powered by Ollama
- Model: gemma4:12b-it-qat
- React framework by Meta
- Vite build tool

---

**Happy Assessing! 🔄♻️**
