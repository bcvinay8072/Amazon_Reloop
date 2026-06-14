# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 1. JSON Parsing Errors

**Error:** "Failed to parse assessment data from Ollama response: Unterminated string in JSON"

**Cause:** The gemma4:12b-it-qat model sometimes returns invalid or incomplete JSON.

**Solutions:**

#### ✅ Solution 1: Use a Different Model (Recommended)
The `gemma4:12b-it-qat` model may not be ideal for JSON output. Try these alternatives:

```bash
# Option A: Use llama3.2-vision (best for images + JSON)
ollama pull llama3.2-vision
```

Then update `src/services/ollama.js`:
```javascript
const MODEL_NAME = 'llama3.2-vision:latest';
```

```bash
# Option B: Use mistral (good JSON compliance)
ollama pull mistral
```

Then update `src/services/ollama.js`:
```javascript
const MODEL_NAME = 'mistral:latest';
```

#### ✅ Solution 2: Check Ollama Logs
View what the model is actually returning:

1. Open browser console (F12)
2. Look for "Raw Ollama response:" in the console
3. Check if the response is valid JSON

#### ✅ Solution 3: Increase Model Temperature
Add temperature control to get more consistent outputs:

In `src/services/ollama.js`, update the request body:
```javascript
const requestBody = {
  model: MODEL_NAME,
  prompt: prompt,
  stream: false,
  format: 'json',
  options: {
    temperature: 0.1,  // Lower = more deterministic
    top_p: 0.9
  }
};
```

### 2. Model Not Found

**Error:** "Model 'gemma4:12b-it-qat' not found"

**Solution:**
```bash
# Check available models
ollama list

# Pull the model if missing
ollama pull gemma4:12b-it-qat
```

### 3. Ollama Service Not Running

**Error:** "Failed to connect to Ollama service"

**Solution:**
```bash
# Start Ollama service
ollama serve

# Or on Windows, check if it's running in Task Manager
# Look for "ollama.exe"
```

### 4. Port 11434 Already in Use

**Error:** "Address already in use"

**Solution:**
```bash
# Find what's using port 11434
netstat -ano | findstr :11434

# Kill the process or restart Ollama
```

### 5. Slow Performance

**Symptoms:** Analysis takes 30+ seconds

**Solutions:**
- First run is always slower (model loading)
- Use smaller images (< 2MB)
- Close other applications
- Upgrade RAM (models need 8GB+)
- Use a faster model like `llama3.2:1b`

### 6. Low Quality Assessments

**Symptoms:** Wrong product names, inaccurate grades

**Solutions:**
- Use better quality photos
- Ensure good lighting
- Single item per image
- Show the full product
- Multiple angles (separate uploads)

### 7. CORS Errors

**Error:** "CORS policy blocked"

**Solution:** This shouldn't happen with local Ollama, but if it does:
- Ensure Ollama is running on localhost
- Check `.env` has `VITE_USE_LOCAL_MOCK=true`
- Restart the dev server

## 🎯 Recommended Model Configuration

For best results with this application:

**Option 1: Vision Model (Best)**
```bash
ollama pull llama3.2-vision:11b
```
Update MODEL_NAME in `src/services/ollama.js`:
```javascript
const MODEL_NAME = 'llama3.2-vision:11b';
```

**Option 2: JSON-Focused Model**
```bash
ollama pull mistral:7b-instruct
```
Update MODEL_NAME in `src/services/ollama.js`:
```javascript
const MODEL_NAME = 'mistral:7b-instruct';
```

## 🔍 Debugging Tips

### Enable Verbose Logging

Add this to `src/services/ollama.js` after the fetch call:

```javascript
// After: const data = await response.json();
console.log('Full Ollama response:', JSON.stringify(data, null, 2));
```

### Test Ollama Directly

Test if Ollama is working outside your app:

```bash
# Test with curl
curl http://localhost:11434/api/generate -d '{
  "model": "gemma4:12b-it-qat",
  "prompt": "Return only this JSON: {\"test\": \"value\"}",
  "stream": false,
  "format": "json"
}'
```

### Check Browser Console

Always check the browser console (F12) for:
- Network errors
- JavaScript errors
- Raw Ollama responses
- Parse errors with actual data

## 💡 Best Practices

1. **Use vision-specific models** for image analysis
2. **Keep images under 2MB** for faster processing
3. **Test with simple images first** (e.g., book covers, phone cases)
4. **Monitor Ollama logs** in terminal where you run `ollama serve`
5. **Update Ollama regularly** - `ollama update`

## 📞 Still Having Issues?

1. Check Ollama is up to date: `ollama --version`
2. Review Ollama documentation: https://ollama.ai/docs
3. Try a different model from https://ollama.ai/library
4. Check system requirements (8GB RAM minimum)

---

**Remember:** The first analysis is always slower as the model loads into memory!
