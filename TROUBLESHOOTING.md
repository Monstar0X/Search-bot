# 🚨 Leapcell Deployment Troubleshooting Guide

## Quick Diagnosis Checklist

If you're seeing deployment errors on Leapcell, go through this checklist:

### ✅ Pre-Deployment Checklist

1. **Environment Variables Set in Leapcell Dashboard?**
   - `BOT_TOKEN` - From @BotFather
   - `OWNER_TELEGRAM_ID` - Your Telegram user ID
   - `WEBHOOK_URL` - `https://your-app.leapcell.dev`
   - `PORT` - `3000` (or leave empty for auto-assign)
   - `NODE_ENV` - `production`

2. **Repository Structure Correct?**
   - `package.json` exists ✅
   - `app.js` exists ✅
   - `.env.example` exists ✅
   - `node_modules` in `.gitignore` ✅

3. **Package.json Configuration?**
   - `"main": "app.js"` ✅
   - `"start": "node app.js"` ✅
   - All dependencies listed ✅

### 🎯 Most Common Leapcell Issues & Solutions

#### Issue 1: "BOT_TOKEN is required"
**What happens:** Deployment fails immediately
**Solution:**
- Go to Leapcell app → Settings → Environment Variables
- Add `BOT_TOKEN` with your actual bot token from @BotFather
- Redeploy the app

#### Issue 2: "Cannot find module 'sqlite3'"
**What happens:** App crashes after starting
**Solution:**
- The `sqlite3` package needs to be built on the target platform
- Add `npm install --build-from-source` to build steps
- Or use `better-sqlite3` instead

#### Issue 3: "Port already in use"
**What happens:** Server fails to start
**Solution:**
- Our app uses `process.env.PORT || 3000` which is correct
- This error usually means something else is wrong

#### Issue 4: "Webhook not set"
**What happens:** Bot starts but doesn't respond to messages
**Solution:**
After deployment, run:
```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_APP_URL.leapcell.dev/botYOUR_BOT_TOKEN"}'
```

#### Issue 5: "Application Error" (Generic)
**What happens:** Vague error in Leapcell logs
**Solution:**
- Check Leapcell application logs for specific error
- Usually environment variable or build issue

### 🔧 Step-by-Step Fix Process

#### Step 1: Verify Local Setup
```bash
# Test locally first
npm install
npm start
```

#### Step 2: Check Environment Variables
In Leapcell dashboard, ensure ALL these are set:
```
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
OWNER_TELEGRAM_ID=123456789
WEBHOOK_URL=https://your-app-name.leapcell.dev
PORT=3000
NODE_ENV=production
```

#### Step 3: Deploy and Monitor
1. Push changes to GitHub
2. Trigger deployment in Leapcell
3. Watch the build logs
4. Check application logs after deployment

#### Step 4: Set Webhook
Once deployed, get your Leapcell URL and set webhook:
```bash
# Replace YOUR_APP_URL and YOUR_BOT_TOKEN
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_APP_URL.leapcell.dev/botYOUR_BOT_TOKEN"}'
```

#### Step 5: Test Bot
- Send `/start` to your bot
- Should receive welcome message
- Try other commands like `/help`

### 🚨 Emergency Fixes

If nothing works, try this minimal version:

#### Create `minimal-app.js`:
```javascript
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN);

app.use(express.json());
app.post(`/bot${process.env.BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🎌 Welcome to Swordsmith Bot!\n\nBot is working!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot running on port ${PORT}`);
  bot.setWebHook(`${process.env.WEBHOOK_URL}/bot${process.env.BOT_TOKEN}`);
});
```

#### Update package.json:
```json
{
  "main": "minimal-app.js",
  "scripts": {
    "start": "node minimal-app.js"
  }
}
```

### 📋 Debug Information to Collect

If you need help, provide:

1. **Exact Error Message** (copy from Leapcell logs)
2. **Environment Variables** (show names, not values)
3. **Build Log** (first few lines and error)
4. **App URL** (your Leapcell app URL)
5. **Bot Token Status** (valid from @BotFather?)

### 🎯 Quick Test Commands

Test webhook manually:
```bash
# Test if your app is running
curl https://YOUR_APP_URL.leapcell.dev/health

# Test webhook endpoint (replace tokens)
curl -X POST https://YOUR_APP_URL.leapcell.dev/botYOUR_BOT_TOKEN \
  -H "Content-Type: application/json" \
  -d '{"update_id":12345,"message":{"message_id":1,"from":{"id":USER_ID,"is_bot":false,"first_name":"Test"},"chat":{"id":USER_ID,"first_name":"Test","type":"private"},"date":1234567890,"text":"/start"}}'
```

### 💡 Pro Tips

1. **Use Simple JavaScript First**: Get the basic bot working, then add features
2. **Check Logs Carefully**: Leapcell logs usually show the exact issue
3. **Environment Variables Matter**: 90% of issues are missing environment variables
4. **Webhook Must Be Set**: Bot won't work without proper webhook configuration
5. **Test Locally**: Ensure code works before deploying

### 🔗 Useful Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Leapcell Documentation](https://docs.leapcell.dev)
- [Express.js Guide](https://expressjs.com/)
- [SQLite3 Node.js](https://github.com/TryGhost/node-sqlite3)

---

## 🆘 Still Need Help?

If you're still experiencing issues after trying these solutions:

1. **Provide the exact error message** from Leapcell logs
2. **Share your environment variable names** (not values)
3. **Show your app URL** (Leapcell app URL)
4. **Confirm your bot token works** with @BotFather

With this information, I can provide a targeted solution for your specific issue!