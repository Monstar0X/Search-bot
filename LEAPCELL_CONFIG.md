# 🚀 Leapcell Production Deployment Configuration

## 📋 Required Environment Variables for Leapcell

Copy these EXACT values into your Leapcell dashboard:

### 🔐 Bot Configuration
```
BOT_TOKEN=8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c
OWNER_TELEGRAM_ID=5862168163
```

### 🌐 Platform Configuration
```
PORT=3000
WEBHOOK_URL=https://YOUR_APP_NAME.leapcell.dev
NODE_ENV=production
```

### 🗄️ Database Configuration
```
DATABASE_PATH=./data/channels.db
MAX_SEARCH_RESULTS=5
SEARCH_HISTORY_ENABLED=true
```

### 🔧 System Configuration
```
SYNC_INTERVAL_HOURS=24
LOG_LEVEL=info
LOG_DIR=./logs
BOT_NAME=Swordsmith Channel Search
WELCOME_MESSAGE_CUSTOM=true
```

## 🎯 Step-by-Step Leapcell Deployment

### Step 1: Repository Setup
✅ Already configured:
- Main entry point: `app.js`
- All dependencies in package.json
- Production-ready code

### Step 2: Environment Variables in Leapcell
1. Go to your Leapcell app dashboard
2. Navigate to **Settings → Environment Variables**
3. Add ALL the variables above exactly as shown
4. **Important:** Replace `YOUR_APP_NAME` with your actual Leapcell app name

### Step 3: Deploy
1. Connect your GitHub repository to Leapcell
2. Select the correct branch
3. Leapcell will automatically:
   - Run `npm install`
   - Start the app with `npm start`
   - Your bot will be running!

### Step 4: Set Webhook (CRITICAL STEP)
After deployment, get your Leapcell URL and run:

```bash
# Replace YOUR_APP_NAME with your actual Leapcell app name
curl -X POST "https://api.telegram.org/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_APP_NAME.leapcell.dev/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c"}'
```

### Step 5: Test Your Bot
1. Send `/start` to your bot in Telegram
2. You should receive: "🎌 Welcome to Swordsmith Channel Search Bot!"
3. Try other commands: `/help`, `/about`, `/support`

## 🔍 Verification Checklist

Before deploying, verify:

- [ ] All environment variables are set in Leapcell dashboard
- [ ] `BOT_TOKEN` is exactly: `8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c`
- [ ] `OWNER_TELEGRAM_ID` is exactly: `5862168163`
- [ ] `WEBHOOK_URL` points to your Leapcell app
- [ ] Repository contains `app.js` as main file
- [ ] `package.json` has `"main": "app.js"`

## 🚨 Security Notes

⚠️ **IMPORTANT SECURITY REMINDERS:**

1. **Bot Token Security:**
   - Never commit your bot token to Git
   - Only set it in Leapcell environment variables
   - If accidentally exposed, regenerate with @BotFather

2. **Access Control:**
   - Only you (ID: 5862168163) will receive admin notifications
   - Bot will ignore commands from unauthorized users for admin functions

3. **Environment Variables:**
   - Leapcell environment variables are secure
   - They are not exposed in the repository

## 🎉 Expected Results

After successful deployment, your bot will:

✅ Respond to `/start` with welcome message and interactive buttons
✅ Handle `/search` commands (placeholder ready for channel data)
✅ Provide `/help`, `/about`, and `/support` information
✅ Send startup notification to you (Telegram ID: 5862168163)
✅ Be accessible 24/7 on Leapcell infrastructure

## 🆘 Troubleshooting

If deployment fails:

1. **Check Leapcell logs** for specific error messages
2. **Verify environment variables** are set exactly as shown
3. **Confirm webhook is set** using the curl command above
4. **Test bot token** with @BotFather to ensure it's valid

## 📞 Need Help?

If you encounter any issues:
1. Check the deployment logs in Leapcell
2. Verify all environment variables match exactly
3. Ensure webhook URL is correct
4. Contact me with the specific error message

Your bot is configured and ready for Leapcell deployment! 🚀