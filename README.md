# Swordsmith Channel Search Bot

A feature-rich Telegram bot that allows users to search through owned anime and swordsmithing channels. The bot automatically syncs with your owned channels, provides an interactive search interface with rich formatting, and includes support for multiple commands and features.

## Features

- 🔍 **Smart Search**: Search across channel names, descriptions, and content
- 🎨 **Rich Interface**: Interactive inline keyboards with MarkdownV2 formatting
- 📊 **Real-time Statistics**: Bot performance and channel analytics
- 🤖 **Automatic Sync**: Periodic synchronization with owned channels
- 🆘 **Support System**: Comprehensive help and FAQ system
- 📱 **Mobile Optimized**: Works perfectly on all Telegram clients
- 🔒 **Privacy Focused**: Minimal data collection with optional search history

## Quick Start

### Prerequisites

- Node.js 18+
- Telegram Bot Token (from @BotFather)
- Your Telegram User ID

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Search-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   BOT_TOKEN=your_telegram_bot_token_here
   OWNER_TELEGRAM_ID=your_telegram_user_id_here
   DATABASE_PATH=./data/channels.db
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

For development:
```bash
npm run dev
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | Yes | Your Telegram bot token from @BotFather |
| `OWNER_TELEGRAM_ID` | Yes | Your Telegram user ID for admin features |
| `DATABASE_PATH` | No | Path to SQLite database (default: `./data/channels.db`) |
| `MAX_SEARCH_RESULTS` | No | Maximum search results to return (default: 5) |
| `SEARCH_HISTORY_ENABLED` | No | Enable search history tracking (default: true) |
| `SYNC_INTERVAL_HOURS` | No | Full sync interval in hours (default: 24) |
| `LOG_LEVEL` | No | Logging level (default: info) |

## Bot Commands

- `/start` - 🏠 Main menu with welcome message
- `/search [query]` - 🔍 Search channels (e.g., `/search anime`)
- `/about` - ℹ️ Bot information and statistics
- `/support` - 🆘 Help and support information
- `/help` - 📚 Usage guide and tips

## Usage Guide

### For Users

1. **Start the bot** - Send `/start` to see the main menu
2. **Search channels** - Click "🔍 Search Channels" or use `/search`
3. **Browse results** - View formatted channel information with join links
4. **Get help** - Use `/support` for FAQs and contact information

### For Channel Owners

1. **Add bot as admin** - Add the bot as administrator to your channels
2. **Automatic sync** - Bot automatically discovers and indexes channels
3. **Monitor activity** - Check `/about` for statistics and sync status
4. **Manual sync** - Admin commands available for channel management

## Development

### Project Structure

```
Search-bot/
├── src/
│   ├── config/
│   │   └── database.ts        # Database configuration
│   ├── models/
│   │   └── Channel.ts          # Channel data model
│   ├── services/
│   │   └── TelegramSyncService.ts  # Channel synchronization
│   ├── bot/
│   │   ├── handlers/
│   │   │   ├── CommandHandler.ts
│   │   │   ├── WelcomeHandler.ts
│   │   │   ├── SearchHandler.ts
│   │   │   ├── SupportHandler.ts
│   │   │   └── AboutHandler.ts
│   │   └── keyboards/
│   │       └── InlineKeyboards.ts
│   └── utils/
│       ├── logger.ts           # Logging configuration
│       └── MessageFormatter.ts # Message formatting
├── data/                       # Database files
├── logs/                       # Log files
├── bot.ts                      # Main bot entry point
├── package.json
├── tsconfig.json
└── README.md
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the production bot
- `npm run dev` - Start with hot-reload for development
- `npm run lint` - Run ESLint for code quality

## Database Schema

The bot uses SQLite with the following tables:

### Channels
- `telegram_id` - Telegram channel ID
- `name` - Channel name
- `username` - Channel username (public channels)
- `description` - Channel description
- `type` - 'public' or 'private'
- `invite_link` - Join link for the channel
- `member_count` - Number of members
- `is_active` - Whether channel is active
- `added_at` - When channel was added
- `last_updated` - Last update timestamp

### Search History
- `user_id` - User ID
- `query` - Search query
- `results_count` - Number of results
- `searched_at` - Search timestamp

### User Sessions
- `user_id` - User ID
- `last_command` - Last command used
- `search_query` - Last search query
- `updated_at` - Session update time

## Deployment

### Local Development

```bash
npm run dev
```

### Production (VPS)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/bot.js --name swordsmith-bot

# Monitor
pm2 monit

# View logs
pm2 logs swordsmith-bot
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/bot.js"]
```

## Troubleshooting

### Common Issues

1. **Bot token invalid**
   - Verify token from @BotFather
   - Ensure bot is not running elsewhere

2. **Database errors**
   - Check data directory permissions
   - Ensure SQLite3 is properly installed

3. **Sync not working**
   - Verify bot is admin in channels
   - Check OWNER_TELEGRAM_ID is correct

4. **Search not finding channels**
   - Ensure channels are synced and active
   - Check search query formatting

### Logs

Check logs in the `logs/` directory:
- `bot.log` - General bot activity
- `error.log` - Errors and warnings
- `sync.log` - Channel synchronization activity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support:
- Create an issue in the repository
- Contact the bot owner via Telegram
- Check the `/support` command in the bot

---

Made with ❤️ for the anime and swordsmithing community