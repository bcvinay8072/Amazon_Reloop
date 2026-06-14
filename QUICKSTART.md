# 🚀 Quick Start Guide - Amazon Re-Loop

## Step-by-Step Setup (5 minutes)

### 1️⃣ Install Ollama (if not already installed)

**Windows:**
```powershell
# Download and run installer from:
# https://ollama.ai/download
```

**Mac:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2️⃣ Pull the AI Model

```bash
ollama pull gemma4:12b-it-qat
```

This will download ~8GB. Grab a coffee! ☕

### 3️⃣ Verify Ollama is Running

```bash
# Should show a list of models including gemma4:12b-it-qat
ollama list
```

### 4️⃣ Install Node.js Dependencies

```bash
npm install
```

This installs React, Vite, and testing tools (~200MB).

### 5️⃣ Start the Development Server

```bash
npm run dev
```

The app will open automatically in your browser at `http://localhost:3000`

## ✅ You're Ready!

1. Click **"Choose Image"**
2. Select a product photo
3. Click **"Analyze Item"**
4. Watch the AI magic happen! ✨

## 🎯 Test Images

Try analyzing:
- Electronics (phones, laptops, tablets)
- Clothing items
- Books
- Toys
- Household items

## ⚡ Pro Tips

**Faster Analysis:**
- Keep Ollama running (first analysis is slower)
- Use well-lit, clear photos
- Single item per image works best

**Better Results:**
- Full product view
- Multiple angles (upload separately)
- Clear focus on any damage

## 🐛 Common Issues

**"Cannot connect to Ollama"**
```bash
# Restart Ollama service
ollama serve
```

**"Model not found"**
```bash
# Re-pull the model
ollama pull gemma4:12b-it-qat
```

**Port 3000 already in use**
```bash
# Vite will automatically try port 3001, 3002, etc.
# Or edit vite.config.js to change the default port
```

## 📚 Next Steps

- Check out `README.md` for full documentation
- Explore the code in `src/services/` to understand the AI integration
- Run tests with `npm test`
- Build for production with `npm run build`

---

**Need help?** Check the main README.md or the comments in the code!
