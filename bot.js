const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_TELEGRAM_ID = process.env.OWNER_TELEGRAM_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const MONGODB_URI = process.env.MONGODB_URI;

// Validate required environment variables
if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required');
  process.exit(1);
}

if (!OWNER_TELEGRAM_ID) {
  console.error('❌ OWNER_TELEGRAM_ID is required');
  process.exit(1);
}

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN);
let db = null;
let client = null;

// MongoDB connection
async function connectToDatabase() {
  if (!MONGODB_URI) {
    console.log('⚠️ MongoDB URI not provided - running in demo mode');
    return false;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB');

    // Initialize collections
    await db.createCollection('channels');
    await db.createCollection('search_history');
    await db.createCollection('user_sessions');

    // Create indexes
    await db.collection('channels').createIndex({ telegram_id: 1 }, { unique: true });
    await db.collection('channels').createIndex({ name: 'text', description: 'text' });
    await db.collection('search_history').createIndex({ user_id: 1, searched_at: -1 });

    console.log('✅ Database initialized');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('🔄 Continuing without database');
    return false;
  }
}

// Middleware
app.use(express.json());

// Webhook endpoint
app.post(`/bot${BOT_TOKEN}`, (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing update:', error);
    res.sendStatus(200);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    bot: 'configured',
    database: db ? 'mongodb_connected' : 'demo_mode'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Swordsmith Channel Search Bot',
    status: 'running',
    database: db ? 'mongodb' : 'demo',
    timestamp: new Date().toISOString()
  });
});

// Database helper functions
async function getChannelStats() {
  if (!db) {
    return { total: 3, public: 2, private: 1, active: 3 }; // Demo stats
  }

  try {
    const stats = await db.collection('channels').aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          public: { $sum: { $cond: [{ $eq: ['$type', 'public'] }, 1, 0] } },
          private: { $sum: { $cond: [{ $eq: ['$type', 'private'] }, 1, 0] } },
          active: { $sum: { $cond: ['$is_active', 1, 0] } }
        }
      }
    ]).toArray();

    return stats[0] || { total: 0, public: 0, private: 0, active: 0 };
  } catch (error) {
    return { total: 3, public: 2, private: 1, active: 3 }; // Fallback stats
  }
}

async function searchChannels(query, limit = 5) {
  if (!db) {
    // Return sample channels for demo mode
    return [
      {
        name: 'Anime Swordsmiths',
        description: 'Traditional and modern sword crafting in anime',
        type: 'public',
        invite_link: 'https://t.me/animeswordsmiths',
        member_count: 15234,
        username: 'animeswordsmiths'
      },
      {
        name: 'Sword Techniques',
        description: 'Learn ancient forging methods and techniques',
        type: 'public',
        invite_link: 'https://t.me/swordtechniques',
        member_count: 8756,
        username: 'swordtechniques'
      }
    ];
  }

  try {
    const channels = await db.collection('channels').find({
      $and: [
        { is_active: true },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { username: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).limit(limit).toArray();

    return channels;
  } catch (error) {
    return [];
  }
}

// Bot command handlers
bot.onText(/\/start/, async (msg) => {
  try {
    const stats = await getChannelStats();
    const welcomeMessage = `🎌 *Welcome to Swordsmith Channel Search Bot*

🔍 Discover amazing anime and swordsmithing channels!
This bot helps you find the best channels from our curated collection.

📊 *Currently indexing:* ${stats.total} active channels
   • Public: ${stats.public} channels
   • Private: ${stats.private} channels

*Choose an option below to get started:*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔍 Search Channels', callback_data: 'search' },
          { text: 'ℹ️ About Bot', callback_data: 'about' }
        ],
        [
          { text: '🆘 Support', callback_data: 'support' },
          { text: '📊 Statistics', callback_data: 'stats' }
        ]
      ]
    };

    await bot.sendMessage(msg.chat.id, welcomeMessage, {
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard
    });

    console.log(`✅ Welcome sent to ${msg.from.id}`);
  } catch (error) {
    console.error('Error in start command:', error);
  }
});

bot.onText(/\/search(?:\s+(.+))?/, async (msg, match) => {
  try {
    const query = match?.[1]?.trim();

    if (!query) {
      await bot.sendMessage(msg.chat.id,
        '🔍 *Search for Channels*\n\nType what you\'re looking for after /search\n\nExample: /search anime',
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const channels = await searchChannels(query, 5);

    if (channels.length === 0) {
      await bot.sendMessage(msg.chat.id,
        `🔍 *No Results*\n\nNo channels found for "${escapeMarkdown(query)}"\n\nTry different keywords!`,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      let results = `🔍 *Found ${channels.length} results for "${escapeMarkdown(query)}":*\n\n`;

      channels.forEach((channel, index) => {
        const name = escapeMarkdown(channel.name);
        const description = channel.description ? escapeMarkdown(channel.description) : 'No description';
        const memberCount = channel.member_count ? formatNumber(channel.member_count) : 'N/A';
        const linkText = channel.type === 'public' && channel.username
          ? `t.me/${channel.username}`
          : 'Private Channel';

        results += `${index + 1}️⃣ *${name}*\n`;
        results += `   ${description}\n`;
        results += `   🔗 Join: [${linkText}](${channel.invite_link})\n`;
        results += `   👥 ${memberCount} members\n\n`;
      });

      await bot.sendMessage(msg.chat.id, results, {
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: false
      });
    }
  } catch (error) {
    console.error('Error in search command:', error);
  }
});

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
💡 Both public and private channels appear

*Database:* ${db ? 'MongoDB Atlas ✅' : 'Demo Mode'}

*Quick Start:*
1️⃣ Press /start to see main menu
2️⃣ Click "🔍 Search Channels"
3️⃣ Type what you're looking for
4️⃣ Click on channel links to join`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔍 Search Channels', callback_data: 'search' },
          { text: '🏠 Main Menu', callback_data: 'start' }
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

bot.onText(/\/about/, async (msg) => {
  try {
    const stats = await getChannelStats();
    const aboutMessage = `ℹ️ *About Swordsmith Channel Search Bot*

🎌 *Version:* 1.0.0
📅 *Created:* 2025
👤 *Owner:* Swordsmith Community

*Bot Statistics:*
📊 Total Channels: ${stats.total}
   • Public: ${stats.public} channels
   • Private: ${stats.private} channels
   • Active: ${stats.active} channels

*Technology Stack:*
🤖 Telegram Bot API
📱 Node.js + Express
💾 ${db ? 'MongoDB Atlas' : 'Demo Database'}
🚀 Leapcell Hosting

*What this bot does:*
✅ Search through anime and swordsmithing channels
✅ Rich formatting and interactive interface
✅ 24/7 availability
✅ ${db ? 'Persistent data storage' : 'Sample data included'}

*Made with ❤️ for the anime and swordsmithing community*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔍 Search Channels', callback_data: 'search' },
          { text: '🆘 Support', callback_data: 'support' }
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

bot.onText(/\/support/, async (msg) => {
  try {
    const supportMessage = `🆘 *Support & Help*

*Frequently Asked Questions:*
❓ *How do I search for channels?*
   → Use /start or /search command

❓ *Bot not responding?*
   → Try again in a few moments

❓ *What database is used?*
   → ${db ? 'MongoDB Atlas - cloud database' : 'Demo mode with sample data'}

❓ *Who owns this bot?*
   → Swordsmith Community

*Features:*
🔍 Channel search
📚 Interactive help
ℹ️ Bot information
🎌 Japanese-themed interface
${db ? '💾 Persistent storage' : '🎭 Demo data'}

*Platform:* Leapcloud Hosting`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📚 Help', callback_data: 'help' },
          { text: '🏠 Main Menu', callback_data: 'start' }
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

// Callback handler
bot.on('callback_query', async (callbackQuery) => {
  try {
    const action = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;

    await bot.answerCallbackQuery(callbackQuery.id);

    switch (action) {
      case 'search':
        await bot.sendMessage(chatId,
          '🔍 *Search for Channels*\n\nUse: /search your_query\n\n💡 Example: /search anime',
          { parse_mode: 'MarkdownV2' }
        );
        break;

      case 'about':
        bot.emitText('about', { chat: { id: chatId } });
        break;

      case 'support':
        bot.emitText('support', { chat: { id: chatId } });
        break;

      case 'help':
        bot.emitText('help', { chat: { id: chatId } });
        break;

      case 'stats':
        const stats = await getChannelStats();
        const statsMessage = `📊 *Live Bot Statistics*

🤖 *Platform:* Leapcell
💾 *Database:* ${db ? 'MongoDB Atlas ✅' : 'Demo Mode'}
⚡ *Uptime:* ${Math.floor(process.uptime())}s
🕒 *Started:* ${new Date().toISOString()}

*Channels:*
📺 Total: ${stats.total}
🌐 Public: ${stats.public}
🔒 Private: ${stats.private}
✅ Active: ${stats.active}

*System Status:*
🟢 API: Online
🟢 Bot: Running
🟢 Database: ${db ? 'Connected' : 'Demo'}
🟢 Hosting: Leapcell`;

        await bot.sendMessage(chatId, statsMessage, {
          parse_mode: 'MarkdownV2'
        });
        break;

      case 'start':
        bot.emitText('start', { chat: { id: chatId } });
        break;

      default:
        await bot.sendMessage(chatId, '🎌 *Main Menu*\n\nUse /start to begin', {
          parse_mode: 'MarkdownV2'
        });
    }
  } catch (error) {
    console.error('Error handling callback:', error);
  }
});

// Helper functions
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Swordsmith Channel Search Bot...');

    // Connect to database (optional)
    await connectToDatabase();

    app.listen(PORT, async () => {
      console.log(`✅ Bot running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🤖 Bot configured for user: ${OWNER_TELEGRAM_ID}`);

      if (WEBHOOK_URL) {
        try {
          // Set webhook
          await bot.setWebHook(`${WEBHOOK_URL}/bot${BOT_TOKEN}`);
          console.log(`✅ Webhook set: ${WEBHOOK_URL}/bot${BOT_TOKEN}`);

          // Send notification to owner
          await bot.sendMessage(OWNER_TELEGRAM_ID,
            `🚀 *Bot Started Successfully!*\n\n🤖 Platform: Leapcell\n💾 Database: ${db ? 'MongoDB Atlas' : 'Demo Mode'}\n⏱️ Uptime: ${Math.floor(process.uptime())}s\n\nBot is ready to serve users!`,
            { parse_mode: 'MarkdownV2' }
          );

        } catch (webhookError) {
          console.error('⚠️ Webhook setup failed:', webhookError.message);
          console.log('🔄 Bot will work in polling mode');

          // Fallback to polling
          bot.startPolling({
            interval: 1000,
            autoStart: true
          });
        }
      } else {
        console.log('⚠️ WEBHOOK_URL not set - Bot will work in polling mode');
        bot.startPolling({
          interval: 1000,
          autoStart: true
        });
      }
    });
  } catch (error) {
    console.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('👋 Shutting down...');
  if (client) {
    await client.close();
    console.log('✅ Database closed');
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('👋 Shutting down...');
  if (client) {
    await client.close();
    console.log('✅ Database closed');
  }
  process.exit(0);
});

// Start the bot
startServer();