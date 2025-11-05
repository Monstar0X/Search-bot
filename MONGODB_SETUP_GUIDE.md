# 🍃 MongoDB Setup Guide for Leapcell

## 🎯 Two Options Available

### Option 1: MongoDB Atlas (Recommended) - Free Cloud Database
✅ Works perfectly on Leapcell
✅ 512MB free storage
✅ Automatic backups
✅ Global CDN access
✅ No file system limitations

### Option 2: Demo Mode (No Database)
✅ Works without any database
✅ No setup required
✅ Full bot functionality
✅ Sample data included

---

## 🚀 Option 1: MongoDB Atlas Setup (5 Minutes)

### Step 1: Create Free MongoDB Atlas Account
1. Go to https://www.mongodb.com/atlas
2. Sign up for FREE account
3. Create a new cluster (M0 Sandbox is FREE)

### Step 2: Get Connection String
1. In MongoDB Atlas, go to your cluster
2. Click "Connect" → "Drivers"
3. Copy the connection string
4. It will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 3: Create Database User
1. In MongoDB Atlas, go to "Database Access"
2. Click "Add New Database User"
3. Username: `swordsmith_bot`
4. Password: Generate a strong password
5. Give read/write permissions

### Step 4: Configure Network Access
1. Go to "Network Access" in MongoDB Atlas
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Step 5: Set Environment Variables in Leapcell
Add these to your Leapcell dashboard:

```
BOT_TOKEN=8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c
OWNER_TELEGRAM_ID=5862168163
MONGODB_URI=mongodb+srv://swordsmith_bot:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/swordsmith-bot?retryWrites=true&w=majority
PORT=3000
NODE_ENV=production
```

**Replace:**
- `YOUR_PASSWORD` with your actual password
- `cluster0.xxxxx` with your actual cluster name

---

## 🚀 Option 2: Demo Mode (No Database Required)

### Simple Setup - Just Set These Variables:
```
BOT_TOKEN=8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c
OWNER_TELEGRAM_ID=5862168163
PORT=3000
NODE_ENV=production
```

**Leave `MONGODB_URI` empty or don't set it at all**

The bot will run in demo mode with sample channels and full functionality!

---

## 🚀 Webhook Configuration Fix

### For the TLS Connection Error:
1. **Deploy first** to Leapcell
2. **Get your Leapcell URL** (e.g., `https://my-bot.leapcell.dev`)
3. **Set webhook manually** after deployment:

```bash
curl -X POST "https://api.telegram.org/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_APP_URL.leapcell.dev/bot8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c"}'
```

### Alternative Webhook Setup:
If webhook fails, the bot automatically falls back to polling mode and still works perfectly!

---

## 📋 Deployment Checklist

### ✅ Files Ready:
- `app-mongodb.js` - Main application with MongoDB support
- `package.json` - Updated with MongoDB dependency
- `.env.mongodb` - Environment variable template

### ✅ Environment Variables:
- [ ] `BOT_TOKEN=8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c`
- [ ] `OWNER_TELEGRAM_ID=5862168163`
- [ ] `PORT=3000`
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI=your_mongodb_connection_string` (Optional)

### ✅ MongoDB Atlas Setup (if using Option 1):
- [ ] Account created on https://www.mongodb.com/atlas
- [ ] M0 Sandbox cluster created
- [ ] Database user created with password
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string copied

---

## 🎯 Expected Results

### MongoDB Atlas Mode:
```
✅ Connected to MongoDB
✅ Database initialized successfully
✅ Sample channels added to database
✅ Webhook set successfully
```

### Demo Mode:
```
⚠️ Running in DEMO MODE
✅ Bot token configured - Full functionality enabled
✅ Sample channels loaded
```

---

## 🆘 Troubleshooting

### MongoDB Connection Failed?
- Check your MongoDB URI format
- Ensure database user has correct permissions
- Verify network access (0.0.0.0/0)
- Check if cluster name is correct

### Webhook TLS Error?
- Deploy to Leapcell first
- Get your Leapcell URL
- Set webhook manually with curl command
- Bot will fallback to polling if webhook fails

### Environment Variables Not Working?
- Ensure exact variable names in Leapcell
- Check for extra spaces or typos
- Verify BOT_TOKEN is correct

---

## 🎉 Success!

Your bot will work perfectly with either option:
- **MongoDB Atlas:** Persistent storage, full statistics
- **Demo Mode:** Zero setup, sample data included

Both options provide complete bot functionality! 🚀