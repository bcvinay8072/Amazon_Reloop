# 📋 Pre-Launch Checklist

Use this checklist to verify everything is ready before running your app.

## ✅ Prerequisites Check

### Node.js Installation
- [ ] Node.js v18+ is installed
  ```bash
  node --version
  # Should show v18.0.0 or higher
  ```

### Ollama Installation
- [ ] Ollama is installed
  ```bash
  ollama --version
  # Should show version number
  ```

- [ ] Ollama service is running
  ```bash
  ollama list
  # Should show list of models (or empty list)
  ```

- [ ] gemma4:12b-it-qat model is available
  ```bash
  ollama list | grep gemma4
  # Should show: gemma4:12b-it-qat
  ```
  
  If not found, pull the model:
  ```bash
  ollama pull gemma4:12b-it-qat
  ```

## ✅ Project Setup Check

### Dependencies Installed
- [ ] Node modules are installed
  ```bash
  npm install
  # Check that node_modules/ folder exists
  ```

### Environment Configuration
- [ ] `.env` file exists
- [ ] `VITE_USE_LOCAL_MOCK=true` is set in `.env`

### Files Present
- [ ] `package.json` exists
- [ ] `vite.config.js` exists
- [ ] `index.html` exists
- [ ] `src/main.jsx` exists
- [ ] `src/App.jsx` exists
- [ ] `src/services/api.js` exists
- [ ] `src/services/ollama.js` exists

## ✅ Ready to Launch

If all items above are checked, you're ready!

### Start the Application

```bash
npm run dev
```

### Expected Behavior
1. ✅ Vite dev server starts
2. ✅ Browser opens automatically to http://localhost:3000
3. ✅ You see "Amazon Re-Loop" header
4. ✅ You can click "Choose Image" button

### Test the Application
1. ✅ Upload a product image
2. ✅ Click "Analyze Item" button
3. ✅ Loading indicator appears
4. ✅ Results display after 5-30 seconds
5. ✅ No errors in browser console

## 🐛 Troubleshooting

If any check fails, see:
- **QUICKSTART.md** - Step-by-step setup
- **README.md** - Full documentation
- **SETUP_COMPLETE.md** - Detailed troubleshooting

## 🎯 Success Criteria

Your app is working correctly if:
- ✅ Page loads without errors
- ✅ Image upload works
- ✅ Analysis completes successfully
- ✅ Results display correctly
- ✅ No console errors (F12 to check)

## 📊 Test Images

For best results, test with:
- Clear product photos
- Good lighting
- Single item per image
- Multiple angles (test separately)

Suggested test items:
- 📱 Smartphone
- 💻 Laptop
- 📚 Book
- 👕 Clothing item
- 🎮 Game console

## ✨ You're Ready!

Once all checks pass, your Amazon Re-Loop MVP is fully operational!

---

**Pro Tip:** Keep this checklist handy for future development sessions!
