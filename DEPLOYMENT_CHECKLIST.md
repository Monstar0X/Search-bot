# ✅ Leapcell Deployment Checklist

## 🎯 Your Configuration
- **Bot Token:** `8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c`
- **Owner ID:** `5862168163`
- **Main File:** `app.js` ✅
- **Start Command:** `node app.js` ✅

## 📋 Pre-Deployment Checklist

### ✅ Repository Files Ready
- [ ] `app.js` - Main application file ✅
- [ ] `package.json` - Dependencies and scripts ✅
- [ ] `.env.example` - Environment template ✅
- [ ] `README.md` - Documentation ✅
- [ ] `node_modules` in `.gitignore` ✅

### ✅ Package.json Configuration
```json
{
  "main": "app.js",
  "start": "node app.js"
}
```
✅ Correctly configured

### ✅ Dependencies Installed
- [ ] `express` - Web server ✅
- [ ] `node-telegram-bot-api` - Telegram integration ✅
- [ ] `sqlite3` - Database ✅
- [ ] `dotenv` - Environment variables ✅

## 🔧 Leapcell Environment Variables Setup

### Required Variables (Set in Leapcell Dashboard)

```bash
# Bot Configuration
BOT_TOKEN=8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c
OWNER_TELEGRAM_ID=5862168163

# Platform Configuration
PORT=3000
WEBHOOK_URL=https://YOUR_APP_NAME.leapcell.dev
NODE_ENV=production

# Database Configuration
DATABASE_PATH=./data/channels.db
MAX_SEARCH_RESULTS=5
SEARCH_HISTORY_ENABLED=true

# System Configuration
SYNC_INTERVAL_HOURS=24
LOG_LEVEL=info
LOG_DIR=./logs
BOT_NAME=Swordsmith Channel Search
WELCOME_MESSAGE_CUSTOM=true
```

## 🚀 Deployment Steps

### Step 1: Deploy to Leapcell
1. Go to your Leapcell dashboard
2. Connect your GitHub repository
3. Select the correct branch
4. **Verify these settings:**
   - Build Command: `npm install` (automatic)
   - Start Command: `npm start`
   - Main File: `app.js`

### Step 2: Set Environment Variables
1. In Leapcell, go to Settings → Environment Variables
2. Add ALL variables from above section
3. **Crucial:** Set `BOT_TOKEN` and `OWNER_TELEGRAM_ID` exactly as shown
4. **Important:** Replace `YOUR_APP_NAME` with your actual Leapcell app name

### Step 3: Deploy and Monitor
1. Trigger deployment
2. Monitor build logs - should show "✅ Server running on port 3000"
3. Check application logs for any errors
4. Verify health endpoint works: `https://YOUR_APP.leapcell.dev/health`

### Step 4: Set Telegram Webhook
After successful deployment, run:

```bash
curl -X POST "https://api.telegram.org/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_APP_NAME.leapcell.dev/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c"}'
```

### Step 5: Final Verification
1. Test health endpoint: `https://YOUR_APP.leapcell.dev/health`
2. Send `/start` to your bot in Telegram
3. You should receive welcome message immediately
4. Check that you (ID: 5862168163) received startup notification

## ✅ Success Indicators

Your deployment is successful when you see:

### Leapcell Logs
```
✅ Database initialized
✅ Server running on port 3000
✅ Webhook set to: https://YOUR_APP_NAME.leapcell.dev/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c
```

### Telegram Response
- Bot responds to `/start` with welcome message
- Interactive buttons work correctly
- You receive startup notification on Telegram

### Health Check
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T...",
  "uptime": 123.45,
  "bot": "running"
}
```

## 🚨 Troubleshooting Quick Fixes

### Issue: "BOT_TOKEN is required"
**Fix:** Ensure `BOT_TOKEN=8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c` is set in Leapcell

### Issue: "Webhook not set"
**Fix:** Run the webhook setup command after deployment

### Issue: Bot not responding
**Fix:**
1. Check Leapcell application logs
2. Verify webhook URL is correct
3. Ensure environment variables are set exactly

### Issue: Database errors
**Fix:** App creates database automatically - should resolve on restart

## 🎯 Expected Bot Features

After successful deployment, your bot will have:

✅ **Welcome System** - `/start` with interactive menu
✅ **Search Function** - `/search` command (ready for channel data)
✅ **Help System** - `/help` with usage instructions
✅ **About Page** - `/about` with bot information
✅ **Support System** - `/support` with FAQ
✅ **Interactive Buttons** - All menu navigation
✅ **Database Backend** - Ready for channel data
✅ **Admin Notifications** - Startup messages to you (ID: 5862168163)

## 📞 Support

If deployment fails:
1. Check Leapcell logs for exact error message
2. Verify all environment variables match exactly
3. Ensure webhook command was run after deployment
4. Share the specific error for targeted assistance

## 🎉 Ready to Deploy!

Your bot is fully configured and ready for Leapcell deployment with your specific credentials. Follow the checklist above for a smooth deployment! 🚀