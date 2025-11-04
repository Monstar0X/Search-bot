# Leapcell Deployment Guide & Troubleshooting

## 🚨 Common Leapcell Deployment Issues & Solutions

### Issue 1: Environment Variables Not Set
**Error:** `BOT_TOKEN is required` or similar
**Solution:** Set these in Leapcell dashboard:
```
BOT_TOKEN=your_telegram_bot_token_here
OWNER_TELEGRAM_ID=your_telegram_user_id_here
WEBHOOK_URL=https://your-app.leapcell.dev
PORT=3000
NODE_ENV=production
```

### Issue 2: Port Not Specified
**Error:** `EADDRINUSE: address already in use`
**Solution:** The app must use Leapcell's PORT:
- Our code already handles this with `process.env.PORT || 3000`

### Issue 3: Build Process Fails
**Error:** TypeScript compilation errors
**Solution:** Ensure `npm run build` runs successfully
- Already working: ✅ Build successful

### Issue 4: Webhook Not Configured
**Error:** Bot doesn't respond to messages
**Solution:** Set Telegram webhook after deployment:
```bash
curl -X POST "https://api.telegram.org/bot{BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.leapcell.dev/bot{BOT_TOKEN}"}'
```

## 🔧 Step-by-Step Leapcell Deployment

### Step 1: Prepare Your Repo
1. Ensure all files are committed to Git
2. Check that `package.json` has correct main file: `"main": "dist/bot-webhook.js"`
3. Verify `tsconfig.json` includes all TypeScript files

### Step 2: Configure Environment Variables in Leapcell
Go to your Leapcell app settings → Environment Variables and add:
```
BOT_TOKEN=your_bot_token_from_botfather
OWNER_TELEGRAM_ID=your_telegram_user_id
WEBHOOK_URL=https://your-app-name.leapcell.dev
PORT=3000
DATABASE_PATH=./data/channels.db
MAX_SEARCH_RESULTS=5
SEARCH_HISTORY_ENABLED=true
SYNC_INTERVAL_HOURS=24
LOG_LEVEL=info
NODE_ENV=production
```

### Step 3: Deploy to Leapcell
1. Connect your GitHub repository to Leapcell
2. Select the correct branch
3. Leapcell will automatically run `npm install` and `npm run build`
4. The app will start using `npm start`

### Step 4: Set Telegram Webhook
After deployment, get your Leapcell URL and set the webhook:
```bash
# Replace YOUR_APP_URL with your actual Leapcell URL
# Replace YOUR_BOT_TOKEN with your bot token
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_APP_URL.leapcell.dev/botYOUR_BOT_TOKEN"}'
```

### Step 5: Test the Bot
1. Send `/start` to your bot in Telegram
2. Check if it responds with welcome message
3. Try search functionality

## 🐛 Debugging Common Errors

### Error: "Cannot find module"
**Cause:** Missing dependencies or incorrect build
**Solution:**
- Ensure `node_modules` is in `.gitignore` (it is)
- Check `npm run build` completes
- Verify all TypeScript files compile to `dist/`

### Error: "Port already in use"
**Cause:** App trying to use fixed port
**Solution:** Our app uses `process.env.PORT || 3000` which is correct

### Error: "Webhook not set"
**Cause:** Telegram doesn't know where to send updates
**Solution:** Run the webhook setup command after deployment

### Error: "Database connection failed"
**Cause:** Database path permissions
**Solution:** Use relative path `./data/channels.db` (already configured)

## 📊 Leapcell-Specific Files Created

1. **`bot-webhook.ts`** - Webhook-compatible bot entry point
2. **`server.ts`** - Express server wrapper
3. **`leapcell.json`** - Platform configuration
4. **Updated `package.json`** - Webhook as main entry point

## 🎯 Quick Fix Checklist

Before deploying to Leapcell, ensure:

- [ ] All environment variables are set in Leapcell dashboard
- [ ] `package.json` main field points to `dist/bot-webhook.js`
- [ ] `npm run build` completes without errors
- [ ] Telegram bot token is valid and active
- [ ] Your Telegram user ID is correct
- [ ] Repository has all required files

## 🚀 Alternative: Simplified Deployment

If issues persist, use this minimal version:

### Create `app.js` (JavaScript version)
```javascript
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

app.use(express.json());

// Webhook endpoint
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Bot commands
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🎌 Welcome to Swordsmith Channel Search Bot!\n\n🔍 Discover amazing anime and swordsmithing channels!\n\nChoose an option below:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔍 Search Channels', callback_data: 'search' }],
        [{ text: 'ℹ️ About', callback_data: 'about' }],
        [{ text: '🆘 Support', callback_data: 'support' }]
      ]
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot running on port ${PORT}`);

  // Set webhook
  bot.setWebHook(`${process.env.WEBHOOK_URL}/bot${token}`).then(() => {
    console.log('✅ Webhook set successfully');
  });
});
```

### Update `package.json` main field:
```json
{
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  }
}
```

## 📞 Getting Help

If you're still experiencing issues:

1. **Check Leapcell logs** - Look for specific error messages
2. **Verify environment variables** - Ensure all required variables are set
3. **Test webhook manually** - Use curl to send test updates
4. **Check bot token** - Ensure it's valid and not expired

**Share the exact error message** from Leapcell logs for targeted assistance!