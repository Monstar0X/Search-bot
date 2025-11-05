const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = process.env.OWNER_TELEGRAM_ID || '5862168163';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Swordsmith Channel Search Bot',
    status: 'running',
    bot: BOT_TOKEN ? 'configured' : 'not configured'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Bot running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);

  if (!BOT_TOKEN) {
    console.log('⚠️  BOT_TOKEN not set in environment variables');
    console.log('📝 Set BOT_TOKEN=8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c');
  } else {
    console.log('✅ Bot token configured');
    console.log('🎯 Ready for Telegram integration');
  }
});

module.exports = app;