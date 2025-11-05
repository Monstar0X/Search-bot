const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_TELEGRAM_ID = process.env.OWNER_TELEGRAM_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!BOT_TOKEN) {
  console.log('⚠️ BOT_TOKEN not set - running in demo mode');
}

// Initialize bot (will work without database)
const bot = new TelegramBot(BOT_TOKEN || 'demo');

// Middleware
app.use(express.json());

// Webhook endpoint for Telegram
app.post(`/bot${BOT_TOKEN || 'demo'}`, (req, res) => {
  if (BOT_TOKEN) {
    bot.processUpdate(req.body);
  }
  res.sendStatus(200);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    bot: BOT_TOKEN ? 'configured' : 'demo_mode'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Swordsmith Channel Search Bot',
    status: 'running',
    mode: BOT_TOKEN ? 'production' : 'demo',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Bot command handlers (work without database)
bot.onText(/\/start/, async (msg) => {
  try {
    const welcomeMessage = `🎌 *Welcome to Swordsmith Channel Search Bot*

🔍 Discover amazing anime and swordsmithing channels!
This bot helps you find the best channels from our curated collection.

*Choose an option below to get started:*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔍 Search Channels', callback_data: 'search_channels' },
          { text: 'ℹ️ About Bot', callback_data: 'about_bot' }
        ],
        [
          { text: '🆘 Help & Support', callback_data: 'support_help' },
          { text: '📊 Statistics', callback_data: 'stats_info' }
        ]
      ]
    };

    await bot.sendMessage(msg.chat.id, welcomeMessage, {
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard
    });

    console.log(`✅ Welcome message sent to ${msg.from.id}`);
  } catch (error) {
    console.error('Error in start command:', error);
  }
});

// /help command
bot.onText(/\/help/, async (msg) => {
  try {
    const helpMessage = `📚 *How to Use This Bot*

*Available Commands:*
/start - 🏠 Main menu
/search \\[query\\] - 🔍 Search channels
/about - ℹ️ Bot information
/support - 🆘 Get help
/help - 📚 This help message

*Search Tips:*
💡 Use keywords like "anime", "sword", "crafting"
💡 Search works for partial matches
💡 Both public and private channels appear in results

*Quick Start:*
1️⃣ Press /start to see main menu
2️⃣ Click "🔍 Search Channels"
3️⃣ Type what you're looking for
4️⃣ Click on channel links to join`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔍 Search Channels', callback_data: 'search_channels' },
          { text: '🏠 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    };

    await bot.sendMessage(msg.chat.id, helpMessage, {
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error in help command:', error);
  }
});

// /about command
bot.onText(/\/about/, async (msg) => {
  try {
    const aboutMessage = `ℹ️ *About Swordsmith Channel Search Bot*

🎌 *Version:* 1.0.0
📅 *Created:* 2025
👤 *Developer:* Swordsmith Community

*What this bot does:*
✅ Search through anime and swordsmithing channels
✅ Rich formatting and interactive interface
✅ User-friendly command system
✅ 24/7 availability on Leapcell platform

*Made with ❤️ for the anime and swordsmithing community*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔍 Search Channels', callback_data: 'search_channels' },
          { text: '🏠 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    };

    await bot.sendMessage(msg.chat.id, aboutMessage, {
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error in about command:', error);
  }
});

// /support command
bot.onText(/\/support/, async (msg) => {
  try {
    const supportMessage = `🆘 *Support & Help*

*Frequently Asked Questions:*
❓ *How do I search for channels?*
   → Use /start or /search command

❓ *Bot not responding?*
   → Try again in a few moments

❓ *Need more help?*
   → Contact the bot owner

*Bot Features:*
🔍 Channel search
📚 Interactive help
ℹ️ Bot information
🎌 Japanese-themed interface`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📚 Help', callback_data: 'help_menu' },
          { text: '🏠 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    };

    await bot.sendMessage(msg.chat.id, supportMessage, {
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error in support command:', error);
  }
});

// /search command (demo version)
bot.onText(/\/search(.*)/, async (msg, match) => {
  try {
    const query = match[1]?.trim();

    if (!query) {
      const promptMessage = `🔍 *Search for Channels*

Type what you're looking for after /search

Example: /search anime

💡 *Tip:* Bot will search through available channels and show results.`;

      await bot.sendMessage(msg.chat.id, promptMessage, {
        parse_mode: 'MarkdownV2'
      });
    } else {
      // Demo search response
      const searchMessage = `🔍 *Search Results for "${escapeMarkdown(query)}"*

📋 *Demo Mode - Channels will appear here once configured*

1️⃣ *Anime Swordsmiths*
   ⚔️ Traditional and modern sword crafting
   🔗 [Join Channel](https://t.me/example)

2️⃣ *Sword Techniques*
   📝 Learn ancient forging methods
   🔗 [Join Channel](https://t.me/example)

*More channels will be added by the bot owner*`;

      await bot.sendMessage(msg.chat.id, searchMessage, {
        parse_mode: 'MarkdownV2'
      });
    }
  } catch (error) {
    console.error('Error in search command:', error);
  }
});

// Callback query handler
bot.on('callback_query', async (callbackQuery) => {
  try {
    const action = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;

    await bot.answerCallbackQuery(callbackQuery.id);

    switch (action) {
      case 'search_channels':
        await bot.sendMessage(chatId, '🔍 *Search for Channels*\n\nUse: /search your_query', {
          parse_mode: 'MarkdownV2'
        });
        break;

      case 'about_bot':
        bot.emitText('about', { chat: { id: chatId } });
        break;

      case 'support_help':
        bot.emitText('support', { chat: { id: chatId } });
        break;

      case 'help_menu':
        bot.emitText('help', { chat: { id: chatId } });
        break;

      case 'main_menu':
        bot.emitText('start', { chat: { id: chatId } });
        break;

      case 'stats_info':
        const statsMessage = `📊 *Bot Statistics*

🤖 *Status:* Running on Leapcell
⚡ *Uptime:* ${Math.floor(process.uptime())}s
🕒 *Started:* ${new Date().toISOString()}
📱 *Version:* 1.0.0

*Platform Features:*
✅ 24/7 availability
✅ Automatic scaling
✅ Global CDN
✅ High performance`;

        await bot.sendMessage(chatId, statsMessage, {
          parse_mode: 'MarkdownV2'
        });
        break;

      default:
        await bot.sendMessage(chatId, '🎌 *Main Menu*\n\nUse /start to begin', {
          parse_mode: 'MarkdownV2'
        });
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
  }
});

// Handle text messages
bot.on('message', async (msg) => {
  try {
    // Skip commands
    if (msg.text?.startsWith('/')) return;

    if (msg.text && msg.text.trim()) {
      await bot.sendMessage(msg.chat.id,
        `🔍 To search, use: /search ${msg.text.trim()}`, {
          parse_mode: 'MarkdownV2'
        });
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Helper function
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Swordsmith Bot running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);

  if (!BOT_TOKEN) {
    console.log('⚠️  Running in DEMO MODE - Set BOT_TOKEN environment variable for full functionality');
  } else {
    console.log('✅ Bot token configured - Full functionality enabled');

    if (WEBHOOK_URL) {
      try {
        await bot.setWebHook(`${WEBHOOK_URL}/bot${BOT_TOKEN}`);
        console.log(`✅ Webhook set to: ${WEBHOOK_URL}/bot${BOT_TOKEN}`);

        // Send startup notification to owner
        if (OWNER_TELEGRAM_ID) {
          await bot.sendMessage(OWNER_TELEGRAM_ID,
            `🚀 *Bot Started Successfully (Leapcell)*\n\n🤖 *Bot:* @${(await bot.getMe()).username}\n🌐 *Platform:* Leapcell\n⏱️ *Uptime:* ${Math.floor(process.uptime())}s\n🕒 *Started:* ${new Date().toISOString()}\n\nBot is ready to serve users!`,
            { parse_mode: 'MarkdownV2' }
          ).catch(err => console.log('Could not send startup notification:', err.message));
        }
      } catch (error) {
        console.error('❌ Failed to set webhook:', error.message);
      }
    } else {
      console.log('⚠️  WEBHOOK_URL not set - Bot will not receive updates');
    }
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});