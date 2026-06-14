# 🚀 Groq Cloud AI Setup Guide

## Why Groq?

✅ **FREE** - Generous free tier (no credit card required)  
✅ **FAST** - 300+ tokens/second (20x faster than local models)  
✅ **NO HARDWARE NEEDED** - Runs in the cloud  
✅ **GUARANTEED JSON** - Native JSON mode ensures valid responses  
✅ **VISION SUPPORT** - Llama 4 Scout can analyze images  
✅ **PRODUCTION READY** - Reliable and scalable  

Perfect for your 8GB VRAM RTX 4060! No more local model struggles! 🎉

---

## 🔑 Step 1: Get Your Free Groq API Key

### 1. Go to Groq Console
Visit: **https://console.groq.com**

### 2. Sign Up (Free)
- Click "Sign Up" or "Get Started"
- Use Google, GitHub, or email
- No credit card required!

### 3. Create API Key
1. Once logged in, click **"API Keys"** in the sidebar
2. Click **"Create API Key"**
3. Give it a name: "Amazon ReLoop"
4. Click **"Create"**
5. **COPY THE KEY** - you won't see it again!

---

## ⚙️ Step 2: Configure Your App

### Add API Key to .env File

1. Open `.env` in your project root
2. Replace `your_groq_api_key_here` with your actual key:

```env
# Amazon Re-Loop Environment Configuration

# AI Service Selection
VITE_AI_SERVICE=groq

# Groq API Key (get free key at: https://console.groq.com/keys)
VITE_GROQ_API_KEY=gsk_your_actual_key_here_xyz123

# Optional: Use local Ollama instead
# VITE_AI_SERVICE=ollama
```

**Important:** Never commit your `.env` file to Git! It's already in `.gitignore`.

---

## 🎯 Step 3: Run Your App

```bash
# Install dependencies (if you haven't)
npm install

# Start the development server
npm run dev
```

That's it! The app will now use Groq instead of local Ollama.

---

## ✨ What You Get with Groq

### Llama 4 Scout Model Features:
- **Vision understanding** - Analyzes product images accurately
- **JSON mode** - Always returns valid, parseable JSON
- **Fast inference** - Results in 2-5 seconds (vs 30+ with local)
- **High quality** - Better product identification and assessment
- **17B parameters** - Powerful reasoning without local hardware

### Free Tier Limits:
- **30 requests per minute**
- **6,000 tokens per minute**
- **14,400 requests per day**

More than enough for development and demos!

---

## 🔄 Switching Between Groq and Ollama

Edit `.env` to switch services:

### Use Groq (Cloud - Recommended)
```env
VITE_AI_SERVICE=groq
VITE_GROQ_API_KEY=gsk_your_key_here
```

### Use Ollama (Local)
```env
VITE_AI_SERVICE=ollama
```

Just change the file and refresh your browser - no restart needed!

---

## 🧪 Test Your Setup

### Quick Test:
1. Start your app: `npm run dev`
2. Upload a product image
3. Click "Analyze Item"
4. Should get results in 2-5 seconds ⚡

### Expected Results:
- ✅ Fast response (2-5 seconds)
- ✅ Valid JSON (no parsing errors)
- ✅ Accurate product identification
- ✅ Detailed issue detection
- ✅ Reasonable price estimates

---

## 🐛 Troubleshooting

### "Groq API key not found"

**Solution:** Check your `.env` file:
- Key should start with `gsk_`
- No quotes needed
- Restart dev server after changing `.env`

### "Invalid Groq API key" (401 error)

**Solutions:**
1. Verify the key is copied correctly (no spaces)
2. Generate a new key at https://console.groq.com/keys
3. Make sure the key is active (not revoked)

### "Rate limit exceeded" (429 error)

**Solution:** Free tier limits hit. Wait 1 minute and try again.

Limits:
- 30 requests/minute
- 14,400 requests/day

### Network errors

**Solution:** Check your internet connection. Groq is cloud-based.

---

## 💡 Pro Tips

### 1. Keep Your API Key Secret
- Never commit `.env` to Git
- Never share your API key
- Regenerate if accidentally exposed

### 2. Monitor Usage
Visit https://console.groq.com/usage to track:
- Requests made
- Tokens used
- Rate limit status

### 3. Optimize Images
- Smaller images = faster analysis
- Keep under 2MB for best performance
- Good lighting improves results

### 4. Handle Rate Limits
If building for production, add retry logic:
```javascript
// Exponential backoff for rate limits
async function analyzeWithRetry(imageData, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await analyzeReturnedItem(imageData);
    } catch (error) {
      if (error.message.includes('429') && i < retries - 1) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
}
```

---

## 📊 Groq vs Local Ollama Comparison

| Feature | Groq Cloud | Local Ollama |
|---------|------------|--------------|
| **Speed** | ⚡ 2-5 sec | 🐌 30-60 sec |
| **Setup** | 🎯 Just API key | 🔧 Install + models |
| **Hardware** | ☁️ None needed | 💻 8GB+ RAM required |
| **JSON Quality** | ✅ Perfect | ⚠️ Sometimes broken |
| **Cost** | 💰 Free tier | 🆓 Free (uses your PC) |
| **Accuracy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Internet** | 🌐 Required | ✅ Works offline |

**Verdict:** Groq wins for development and demos! 🏆

---

## 🎓 Learning Resources

- **Groq Documentation:** https://console.groq.com/docs
- **API Reference:** https://console.groq.com/docs/api-reference
- **Rate Limits:** https://console.groq.com/docs/rate-limits
- **Models:** https://console.groq.com/docs/models

---

## 🎉 You're All Set!

Your Amazon Re-Loop app now uses Groq's powerful cloud AI:
- ⚡ Lightning fast analysis
- 🎯 Accurate results
- 💾 No local hardware stress
- 🔒 Secure API-based access

**Ready to analyze some products? Let's go! 🚀**
