// Test script for final bot
process.env.BOT_TOKEN = '8589102110:AAHm624wAnk1yA7IuWgnZ7KIXdxV1Dg1Z1c';
process.env.OWNER_TELEGRAM_ID = '5862168163';

console.log('🧪 Testing Final Bot...');
setTimeout(() => {
  console.log('✅ Bot startup successful!');
  process.exit(0);
}, 2000);

require('./bot.js');