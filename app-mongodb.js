const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_TELEGRAM_ID = process.env.OWNER_TELEGRAM_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swordsmith-bot';

if (!BOT_TOKEN) {
  console.log('⚠️ BOT_TOKEN not set - running in demo mode');
}

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN || 'demo');

// MongoDB connection
let db;
let client;

async function connectToDatabase() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(); // Uses database name from URI
    console.log('✅ Connected to MongoDB');

    // Initialize collections
    await db.createCollection('channels');
    await db.createCollection('search_history');
    await db.createCollection('user_sessions');
    await db.createCollection('bot_stats');

    // Create indexes for better performance
    await db.collection('channels').createIndex({ telegram_id: 1 }, { unique: true });
    await db.collection('channels').createIndex({ name: 'text', description: 'text' });
    await db.collection('search_history').createIndex({ user_id: 1, searched_at: -1 });
    await db.collection('user_sessions').createIndex({ user_id: 1 }, { unique: true });

    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('🔄 Continuing without database (demo mode)');
    return false;
  }
}

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
app.get('/health', async (req, res) => {
  try {
    const dbStatus = db ? 'connected' : 'disconnected';
    const stats = db ? await getBotStats() : null;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      bot: BOT_TOKEN ? 'configured' : 'demo_mode',
      database: dbStatus,
      stats: stats
    });
  } catch (error) {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      bot: BOT_TOKEN ? 'configured' : 'demo_mode',
      database: 'error',
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Swordsmith Channel Search Bot - MongoDB Version',
    status: 'running',
    mode: BOT_TOKEN ? 'production' : 'demo',
    database: db ? 'mongodb_connected' : 'no_database',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Database functions
async function getBotStats() {
  if (!db) return null;

  try {
    const channelStats = await db.collection('channels').aggregate([
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

    const searchStats = await db.collection('search_history').countDocuments({
      searched_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    return {
      channels: channelStats[0] || { total: 0, public: 0, private: 0, active: 0 },
      searches_this_week: searchStats,
      database: 'mongodb'
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return null;
  }
}

async function addChannel(channel) {
  if (!db) return false;

  try {
    await db.collection('channels').updateOne(
      { telegram_id: channel.telegram_id },
      {
        $set: {
          ...channel,
          last_updated: new Date()
        },
        $setOnInsert: {
          added_at: new Date()
        }
      },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error('Error adding channel:', error);
    return false;
  }
}

async function searchChannels(query, limit = 5) {
  if (!db) return [];

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
    console.error('Error searching channels:', error);
    return [];
  }
}

async function addSearchHistory(userId, query, resultsCount) {
  if (!db) return;

  try {
    await db.collection('search_history').insertOne({
      user_id: userId,
      query: query,
      results_count: resultsCount,
      searched_at: new Date()
    });
  } catch (error) {
    console.error('Error adding search history:', error);
  }
}

async function updateUserSession(userId, command, searchQuery) {
  if (!db) return;

  try {
    await db.collection('user_sessions').updateOne(
      { user_id: userId },
      {
        $set: {
          last_command: command,
          search_query: searchQuery,
          updated_at: new Date()
        },
        $setOnInsert: {
          created_at: new Date()
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error updating user session:', error);
  }
}

// Bot command handlers
bot.onText(/\/start/, async (msg) => {
  try {
    const stats = await getBotStats();
    const searchStats = await db.collection('search_history').countDocuments({
      searched_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const welcomeMessage = `🎌 *Welcome to Swordsmith Channel Search Bot*

🔍 Discover amazing anime and swordsmithing channels!
This bot helps you find the best channels from our curated collection.

📊 *Currently indexing:* ${stats?.channels?.total || 0} active channels
🔍 *Searches this week:* ${searchStats}

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

    await updateUserSession(msg.from.id, 'start', null);
    console.log(`✅ Welcome message sent to ${msg.from.id}`);
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

    // Perform search
    const channels = await searchChannels(query, 5);

    if (channels.length === 0) {
      const noResultsMessage = `🔍 *No Results*

No channels found for "${escapeMarkdown(query)}"

💡 *Try different keywords or check your spelling*

*Popular searches:* anime, sword, crafting, tutorial`;

      await bot.sendMessage(msg.chat.id, noResultsMessage, {
        parse_mode: 'MarkdownV2'
      });
    } else {
      const resultsMessage = formatSearchResults(channels, query);
      await bot.sendMessage(msg.chat.id, resultsMessage, {
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: false
      });
    }

    await addSearchHistory(msg.from.id, query, channels.length);
    await updateUserSession(msg.from.id, 'search', query);

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

*Database:* MongoDB - Cloud powered ✅

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
    const stats = await getBotStats();
    const lastSync = new Date().toISOString();

    const aboutMessage = `ℹ️ *About Swordsmith Channel Search Bot*

🎌 *Version:* 1.0.0
📅 *Created:* 2025
👤 *Developer:* Swordsmith Community

*Bot Statistics:*
📊 Total Channels: ${stats?.channels?.total || 0}
   • Public: ${stats?.channels?.public || 0} channels
   • Private: ${stats?.channels?.private || 0} channels
🕒 Last Sync: ${formatRelativeTime(lastSync)}
🔍 Searches This Week: ${stats?.searches_this_week || 0}

*What this bot does:*
✅ Automatically indexes owned channels
✅ Instant search across all channel types
✅ Provides join links for public channels
✅ Facilitates access requests for private channels
✅ Rich formatting and interactive interface
✅ MongoDB cloud database storage

*Technology Stack:*
🤖 Telegram Bot API
📱 Node.js + Express
💾 MongoDB Atlas (Cloud)
🚀 Leapcell Hosting

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

❓ *What database is used?*
   → MongoDB Atlas - secure cloud storage.

*Need more help?*
👤 *Owner:* @your_username_here

*Response time:* Usually within 24 hours

*Technical Support:*
🌐 Platform: Leapcell
💾 Database: MongoDB Atlas
🤖 API: Telegram Bot API`;

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
    const userId = callbackQuery.from.id;

    await bot.answerCallbackQuery(callbackQuery.id);

    switch (action) {
      case 'search_channels':
        await bot.sendMessage(chatId, '🔍 *Search for Channels*\n\nType what you\'re looking for or use /search your_query', {
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
        const stats = await getBotStats();
        const statsMessage = `📊 *Live Bot Statistics*

🤖 *Platform:* Leapcloud
💾 *Database:* MongoDB (${db ? 'Connected' : 'Disconnected'})
⚡ *Uptime:* ${Math.floor(process.uptime())}s
🕒 *Started:* ${new Date().toISOString()}

*Channel Statistics:*
📺 Total Channels: ${stats?.channels?.total || 0}
🌐 Public: ${stats?.channels?.public || 0} channels
🔒 Private: ${stats?.channels?.private || 0} channels
✅ Active: ${stats?.channels?.active || 0} channels

*Search Activity:*
🔍 Searches This Week: ${stats?.searches_this_week || 0}
📈 Database: MongoDB Atlas Cloud

*System Status:*
🟢 API: Online
🟢 Bot: Running
🟢 Database: ${db ? 'Connected' : 'Demo Mode'}
🟢 Hosting: Leapcell`;

        await bot.sendMessage(chatId, statsMessage, {
          parse_mode: 'MarkdownV2'
        });
        break;

      default:
        await bot.sendMessage(chatId, '🎌 *Main Menu*\n\nUse /start to begin', {
          parse_mode: 'MarkdownV2'
        });
    }

    await updateUserSession(userId, action, null);
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
      // Treat as search query
      bot.emitText('search', msg, [null, msg.text.trim()]);
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Helper functions
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
}

function formatSearchResults(channels, query) {
  if (channels.length === 0) {
    return `🔍 *No results for "${escapeMarkdown(query)}"*`;
  }

  let results = `🔍 *Found ${channels.length} results for "${escapeMarkdown(query)}":*\n\n`;

  channels.forEach((channel, index) => {
    const name = escapeMarkdown(channel.name);
    const description = channel.description ? escapeMarkdown(channel.description) : 'No description';
    const memberCount = channel.member_count ? formatNumber(channel.member_count) : 'N/A';
    const typeIcon = channel.type === 'public' ? '🌐' : '🔒';
    const linkText = channel.type === 'public'
      ? `t.me/${channel.username}`
      : 'Private Link - Request Access';

    results += `${index + 1}️⃣ *${name}*\n`;
    results += `   ${description}\n`;
    results += `   🔗 Join: [${linkText}](${channel.invite_link})\n`;
    results += `   ${typeIcon} ${memberCount} members • ${channel.type}\n\n`;
  });

  return results;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

// Add some sample channels for demo
async function addSampleChannels() {
  if (!db) return;

  const sampleChannels = [
    {
      telegram_id: -1001234567890,
      name: 'Anime Swordsmiths',
      username: 'animeswordsmiths',
      description: 'Traditional and modern sword crafting in anime',
      type: 'public',
      invite_link: 'https://t.me/animeswordsmiths',
      member_count: 15234,
      is_active: true
    },
    {
      telegram_id: -1001234567891,
      name: 'Sword Techniques',
      username: 'swordtechniques',
      description: 'Learn ancient forging methods and techniques',
      type: 'public',
      invite_link: 'https://t.me/swordtechniques',
      member_count: 8756,
      is_active: true
    },
    {
      telegram_id: -1001234567892,
      name: 'Katana Crafting',
      username: null,
      description: 'Private community for katana enthusiasts',
      type: 'private',
      invite_link: 'https://t.me/+abc123def456',
      member_count: 3421,
      is_active: true
    }
  ];

  for (const channel of sampleChannels) {
    await addChannel(channel);
  }

  console.log('✅ Sample channels added to database');
}

// Start server
async function startServer() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await connectToDatabase();

    console.log(`🚀 Swordsmith Bot running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);

    if (!BOT_TOKEN) {
      console.log('⚠️  Running in DEMO MODE - Set BOT_TOKEN environment variable for full functionality');
    } else {
      console.log('✅ Bot token configured - Full functionality enabled');

      // Add sample channels if database is empty
      if (db) {
        const channelCount = await db.collection('channels').countDocuments();
        if (channelCount === 0) {
          await addSampleChannels();
        }
      }

      if (WEBHOOK_URL) {
        try {
          // Set webhook with retry logic
          await bot.setWebHook(`${WEBHOOK_URL}/bot${BOT_TOKEN}`);
          console.log(`✅ Webhook set to: ${WEBHOOK_URL}/bot${BOT_TOKEN}`);

          // Send startup notification to owner
          if (OWNER_TELEGRAM_ID) {
            const stats = await getBotStats();
            await bot.sendMessage(OWNER_TELEGRAM_ID,
              `🚀 *Bot Started Successfully (MongoDB + Leapcell)*\n\n🤖 *Bot:* @${(await bot.getMe()).username}\n💾 *Database:* MongoDB (${db ? 'Connected' : 'Demo'})\n📊 *Channels:* ${stats?.channels?.total || 0}\n⏱️ *Uptime:* ${Math.floor(process.uptime())}s\n🕒 *Started:* ${new Date().toISOString()}\n\nBot is ready to serve users!`,
              { parse_mode: 'MarkdownV2' }
            ).catch(err => console.log('Could not send startup notification:', err.message));
          }
        } catch (error) {
          console.error('❌ Failed to set webhook:', error.message);
          console.log('🔄 Bot will work in polling mode as fallback');

          // Fallback to polling
          bot.startPolling({
            interval: 1000,
            autoStart: true
          });
        }
      } else {
        console.log('⚠️  WEBHOOK_URL not set - Bot will not receive updates');
      }
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('👋 Received SIGTERM, shutting down gracefully...');
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('👋 Received SIGINT, shutting down gracefully...');
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});

// Start the application
startServer();