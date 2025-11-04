const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_TELEGRAM_ID = process.env.OWNER_TELEGRAM_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required');
  process.exit(1);
}

if (!OWNER_TELEGRAM_ID) {
  console.error('❌ OWNER_TELEGRAM_ID is required');
  process.exit(1);
}

// Initialize bot with webhook mode
const bot = new TelegramBot(BOT_TOKEN);

// Middleware
app.use(express.json());

// Database setup
const dbPath = process.env.DATABASE_PATH || './data/channels.db';
const db = new sqlite3.Database(dbPath);

// Initialize database tables
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Channels table
      db.run(`CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        username TEXT,
        description TEXT,
        type TEXT CHECK(type IN ('public', 'private')) NOT NULL,
        invite_link TEXT NOT NULL,
        member_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

      // Search history table
      db.run(`CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        query TEXT NOT NULL,
        results_count INTEGER DEFAULT 0,
        searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

      // User sessions table
      db.run(`CREATE TABLE IF NOT EXISTS user_sessions (
        user_id INTEGER PRIMARY KEY,
        last_command TEXT,
        search_query TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

// Webhook endpoint for Telegram
app.post(`/bot${BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    bot: 'running'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Swordsmith Channel Search Bot',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Bot command handlers

// /start command
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
  } catch (error) {
    console.error('Error in start command:', error);
    bot.sendMessage(msg.chat.id, '❌ Sorry, something went wrong. Please try again.');
  }
});

// /search command
bot.onText(/\/search(?:\s+(.+))?/, async (msg, match) => {
  try {
    const query = match?.[1]?.trim();

    if (!query) {
      const promptMessage = `🔍 *Search for Channels*

Type what you're looking for...

💡 *Examples:* "anime", "sword", "crafting", "tutorials"

You can also use the /search command followed by your query.`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔍 New Search', callback_data: 'search_channels' },
            { text: '📚 Help', callback_data: 'help_menu' }
          ]
        ]
      };

      await bot.sendMessage(msg.chat.id, promptMessage, {
        parse_mode: 'MarkdownV2',
        reply_markup: keyboard
      });
      return;
    }

    // Search channels (placeholder - add actual database search)
    await performSearch(msg.chat.id, msg.from.id, query);
  } catch (error) {
    console.error('Error in search command:', error);
    bot.sendMessage(msg.chat.id, '❌ Search failed. Please try again.');
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
💡 Private channels require access approval

*Quick Start:*
1️⃣ Press /start to see main menu
2️⃣ Click "🔍 Search Channels"
3️⃣ Type what you're looking for
4️⃣ Click on channel links to join

*Need more help?* → /support`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔍 Search Channels', callback_data: 'search_channels' },
          { text: 'ℹ️ About Bot', callback_data: 'about_bot' }
        ],
        [
          { text: '🆘 Support', callback_data: 'support_help' },
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
    bot.sendMessage(msg.chat.id, '❌ Sorry, something went wrong.');
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
✅ Automatically indexes 200+ owned channels
✅ Instant search across all channel types
✅ Provides join links for public channels
✅ Facilitates access requests for private channels
✅ Rich formatting and interactive interface

*Made with ❤️ for the anime and swordsmithing community*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔍 Search Channels', callback_data: 'search_channels' },
          { text: '🆘 Support', callback_data: 'support_help' }
        ],
        [
          { text: '📚 Help', callback_data: 'help_menu' },
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
    bot.sendMessage(msg.chat.id, '❌ Sorry, something went wrong.');
  }
});

// /support command
bot.onText(/\/support/, async (msg) => {
  try {
    const supportMessage = `🆘 *Support & Help*

*Frequently Asked Questions:*
❓ *How do I join private channels?*
   → Click the link and request access. Admins review requests.

❓ *Can I suggest channels?*
   → Contact @owner_username with suggestions.

❓ *Bot not working?*
   → Try /start or contact support below.

*Need more help?*
👤 *Owner:* @your_username_here

*Response time:* Usually within 24 hours`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📚 View Help', callback_data: 'help_menu' },
          { text: 'ℹ️ About Bot', callback_data: 'about_bot' }
        ],
        [
          { text: '🔍 Search Channels', callback_data: 'search_channels' },
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
    bot.sendMessage(msg.chat.id, '❌ Sorry, something went wrong.');
  }
});

// Callback query handler
bot.on('callback_query', async (callbackQuery) => {
  try {
    const action = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;

    // Answer the callback query to remove loading state
    await bot.answerCallbackQuery(callbackQuery.id);

    switch (action) {
      case 'search_channels':
        await bot.sendMessage(chatId, '🔍 *Search for Channels*\n\nType what you\'re looking for...', {
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

      default:
        await bot.sendMessage(chatId, '❌ This action is not available.');
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
  }
});

// Handle text messages (for search)
bot.on('message', async (msg) => {
  try {
    // Skip if message is a command
    if (msg.text?.startsWith('/')) {
      return;
    }

    // Skip if message has no text
    if (!msg.text) {
      return;
    }

    const query = msg.text.trim();
    if (query.length > 0) {
      await performSearch(msg.chat.id, msg.from.id, query);
    }
  } catch (error) {
    console.error('Error handling text message:', error);
  }
});

// Search function (placeholder)
async function performSearch(chatId, userId, query) {
  try {
    // For now, return a placeholder message
    const searchMessage = `🔍 *Found 0 results for "${escapeMarkdown(query)}":*

No channels found. Try different keywords!

💡 *Tip:* The bot needs to be configured with your channels. Contact the bot owner to add channels.`;

    await bot.sendMessage(chatId, searchMessage, {
      parse_mode: 'MarkdownV2'
    });

    // Log search attempt
    console.log(`Search from user ${userId}: "${query}"`);
  } catch (error) {
    console.error('Error in performSearch:', error);
    throw error;
  }
}

// Helper function to escape markdown
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
}

// Start server
async function startServer() {
  try {
    console.log('🔧 Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized');

    console.log(`🚀 Starting server on port ${PORT}`);
    app.listen(PORT, async () => {
      console.log(`✅ Server running on port ${PORT}`);

      if (WEBHOOK_URL) {
        try {
          await bot.setWebHook(`${WEBHOOK_URL}/bot${BOT_TOKEN}`);
          console.log(`✅ Webhook set to: ${WEBHOOK_URL}/bot${BOT_TOKEN}`);

          // Send startup notification to owner
          await bot.sendMessage(OWNER_TELEGRAM_ID,
            `🚀 *Bot Started Successfully (Leapcell)*\n\n🤖 *Bot:* Running\n🌐 *URL:* ${WEBHOOK_URL}\n⏱️ *Started:* ${new Date().toISOString()}\n\nBot is ready to serve users!`,
            { parse_mode: 'MarkdownV2' }
          );
        } catch (error) {
          console.error('❌ Failed to set webhook:', error);
        }
      } else {
        console.log('⚠️ WEBHOOK_URL not set, bot will not receive updates');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database closed');
    }
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database closed');
    }
    process.exit(0);
  });
});

// Start the application
startServer();