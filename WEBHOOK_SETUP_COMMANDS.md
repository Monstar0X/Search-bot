# 🤖 Telegram Webhook Setup Commands

## 📋 Your Bot Information
- **Bot Token:** `8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c`
- **Owner ID:** `5862168163`
- **Webhook URL Pattern:** `https://YOUR_APP_NAME.leapcell.dev/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c`

## 🚀 Step 1: Deploy to Leapcell First

1. Deploy your app to Leapcell
2. Get your Leapcell app URL (e.g., `https://my-swordsmith-bot.leapcell.dev`)
3. Replace `YOUR_APP_NAME` in the webhook URL below

## 🔧 Step 2: Set Webhook (Run This Command)

After your app is deployed on Leapcell, run this command in your terminal:

```bash
# Replace YOUR_APP_NAME with your actual Leapcell app name
curl -X POST "https://api.telegram.org/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_APP_NAME.leapcell.dev/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c"}'
```

### Example:
If your Leapcell app is `swordsmith-bot`, the command would be:
```bash
curl -X POST "https://api.telegram.org/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://swordsmith-bot.leapcell.dev/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c"}'
```

## ✅ Step 3: Verify Webhook is Set

Check if webhook is properly configured:

```bash
curl "https://api.telegram.org/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c/getWebhookInfo"
```

You should see a response like:
```json
{
  "ok": true,
  "result": {
    "url": "https://YOUR_APP_NAME.leapcell.dev/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40,
    "ip_address": "123.45.67.89"
  }
}
```

## 🔄 Step 4: Test Your Bot

1. Send `/start` to your bot in Telegram
2. You should receive an immediate response
3. Try other commands: `/help`, `/about`, `/support`

## 🧪 Alternative: Manual Testing (Optional)

Test your webhook endpoint directly:

```bash
# Test if your Leapcell app is running
curl https://YOUR_APP_NAME.leapcell.dev/health

# Should return: {"status":"healthy","timestamp":"...","uptime":...,"bot":"running"}
```

## 🚨 Troubleshooting Webhook Issues

### Issue: "Webhook already set"
**Solution:** Delete and recreate:
```bash
curl -X POST "https://api.telegram.org/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c/deleteWebhook"
```
Then set it again with the setWebhook command.

### Issue: "Bad Request: url is invalid"
**Solution:**
1. Verify your Leapcell app is deployed and running
2. Check the URL is correct (no typos)
3. Ensure HTTPS is used (Leapcell provides this)

### Issue: Bot not responding
**Solution:**
1. Check Leapcell application logs for errors
2. Verify environment variables are set correctly
3. Ensure webhook URL matches exactly

## 📊 Monitoring Your Bot

Check your bot's status:
```bash
# Get bot info
curl "https://api.telegram.org/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c/getMe"

# Get webhook info
curl "https://api.telegram.org/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c/getWebhookInfo"
```

## 🎉 Success Indicators

Your setup is successful when:

✅ `getWebhookInfo` shows your Leapcell URL
✅ Health endpoint responds: `{"status":"healthy"}`
✅ Bot responds to `/start` command
✅ All interactive buttons work
✅ You receive startup notification on Telegram

## 📞 Need Help?

If webhook setup fails:
1. Verify your Leapcell app is running
2. Check the exact URL in your Leapcell dashboard
3. Ensure all environment variables are set in Leapcell
4. Share the error message from the curl command

Your bot is ready to go live on Leapcell! 🚀