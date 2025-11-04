import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { database } from './src/config/database';
import { TelegramSyncService } from './src/services/TelegramSyncService';
import { CommandHandler } from './src/bot/handlers/CommandHandler';
import { WelcomeHandler } from './src/bot/handlers/WelcomeHandler';
import { SearchHandler } from './src/bot/handlers/SearchHandler';
import { SupportHandler } from './src/bot/handlers/SupportHandler';
import { AboutHandler } from './src/bot/handlers/AboutHandler';
import logger from './src/utils/logger';
import express from 'express';

// Load environment variables
dotenv.config();

// Validate required environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_TELEGRAM_ID = process.env.OWNER_TELEGRAM_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  logger.error('BOT_TOKEN is required in environment variables');
  process.exit(1);
}

if (!OWNER_TELEGRAM_ID) {
  logger.error('OWNER_TELEGRAM_ID is required in environment variables');
  process.exit(1);
}

const ownerTelegramId = parseInt(OWNER_TELEGRAM_ID!);

class SwordsmithWebhookBot {
  private bot: TelegramBot;
  private syncService: TelegramSyncService;
  private commandHandler: CommandHandler;
  private app: express.Application;
  private isShuttingDown = false;

  constructor() {
    // Initialize bot with webhook mode
    this.bot = new TelegramBot(BOT_TOKEN!);

    // Initialize Express app
    this.app = express();

    // Initialize sync service
    this.syncService = new TelegramSyncService(this.bot, ownerTelegramId);

    // Initialize handlers
    const welcomeHandler = new WelcomeHandler(this.bot);
    const searchHandler = new SearchHandler(this.bot);
    const supportHandler = new SupportHandler(this.bot);
    const aboutHandler = new AboutHandler(this.bot);

    // Initialize command handler
    this.commandHandler = new CommandHandler(
      this.bot,
      welcomeHandler,
      searchHandler,
      supportHandler,
      aboutHandler
    );

    this.setupWebhook();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupGracefulShutdown();
  }

  private setupWebhook(): void {
    if (WEBHOOK_URL) {
      // Set webhook
      this.bot.setWebHook(`${WEBHOOK_URL}/bot${BOT_TOKEN}`).then(() => {
        logger.info(`Webhook set to: ${WEBHOOK_URL}/bot${BOT_TOKEN}`);
      }).catch((error) => {
        logger.error('Failed to set webhook:', error);
        process.exit(1);
      });
    } else {
      logger.warn('WEBHOOK_URL not set, using polling mode');
      // Fallback to polling
      this.bot.startPolling({
        interval: 1000,
        autoStart: true,
        params: {
          timeout: 10
        }
      });
    }
  }

  private setupRoutes(): void {
    // Express route for webhook
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        bot: 'running'
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Swordsmith Channel Search Bot (Webhook Mode)',
        status: 'running',
        timestamp: new Date().toISOString()
      });
    });

    // Webhook endpoint for Telegram updates
    this.app.post(`/bot${BOT_TOKEN}`, (req, res) => {
      this.bot.processUpdate(req.body);
      res.sendStatus(200);
    });

    // General webhook endpoint (if not using token in path)
    this.app.post('/webhook', (req, res) => {
      this.bot.processUpdate(req.body);
      res.sendStatus(200);
    });
  }

  private setupErrorHandling(): void {
    // Handle webhook errors
    this.bot.on('webhook_error', (error) => {
      logger.error('Telegram webhook error:', error);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown('SIGTERM');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Express error handling
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Express error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGINT', 'SIGTERM', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, () => {
        logger.info(`Received ${signal}, starting graceful shutdown...`);
        this.gracefulShutdown(signal);
      });
    });
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    logger.info(`Starting graceful shutdown due to ${signal}`);

    try {
      // Stop webhook
      if (WEBHOOK_URL) {
        await this.bot.deleteWebhook();
        logger.info('Webhook deleted');
      } else {
        await this.bot.stopPolling();
        logger.info('Bot polling stopped');
      }

      // Stop sync service
      this.syncService.stopScheduledSync();
      logger.info('Sync service stopped');

      // Close database connection
      await database.close();
      logger.info('Database connection closed');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Swordsmith Channel Search Bot (Webhook Mode)...');

      // Initialize database
      await database.initialize();
      logger.info('Database initialized successfully');

      // Initialize command handlers
      this.commandHandler.initialize();
      logger.info('Command handlers initialized');

      // Initialize sync service
      await this.syncService.initializeScheduledSync();
      logger.info('Sync service initialized');

      // Bot info
      const botInfo = await this.bot.getMe();
      logger.info(`Bot initialized: @${botInfo.username} (ID: ${botInfo.id})`);

      // Send startup notification to owner
      await this.sendStartupNotification();

      logger.info('Swordsmith Channel Search Bot (Webhook Mode) is now running!');

    } catch (error) {
      logger.error('Failed to initialize bot:', error);
      throw error;
    }
  }

  private async sendStartupNotification(): Promise<void> {
    try {
      const stats = await database.get('SELECT COUNT(*) as total FROM channels WHERE is_active = 1');
      const uptime = process.uptime();

      const message = `🚀 *Bot Started Successfully (Webhook Mode)*

🤖 *Bot:* @${(await this.bot.getMe()).username}
📊 *Channels:* ${stats.total} active
⏱️ *Uptime:* ${Math.floor(uptime)}s
🕒 *Started:* ${new Date().toISOString()}

Bot is ready to serve users!`;

      await this.bot.sendMessage(ownerTelegramId, message, {
        parse_mode: 'MarkdownV2'
      });
    } catch (error) {
      logger.error('Failed to send startup notification:', error);
    }
  }

  getApp(): express.Application {
    return this.app;
  }
}

// Initialize and start the bot
async function main() {
  try {
    const bot = new SwordsmithWebhookBot();
    await bot.initialize();

    // Start Express server
    const app = bot.getApp();
    app.listen(PORT, () => {
      logger.info(`🚀 Webhook server running on port ${PORT}`);
      logger.info(`📡 Webhook endpoint: ${WEBHOOK_URL || `/bot${BOT_TOKEN}`}`);
    });

  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the bot
if (require.main === module) {
  main();
}

export { SwordsmithWebhookBot };