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

// Load environment variables
dotenv.config();

// Validate required environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_TELEGRAM_ID = process.env.OWNER_TELEGRAM_ID;

if (!BOT_TOKEN) {
  logger.error('BOT_TOKEN is required in environment variables');
  process.exit(1);
}

if (!OWNER_TELEGRAM_ID) {
  logger.error('OWNER_TELEGRAM_ID is required in environment variables');
  process.exit(1);
}

const ownerTelegramId = parseInt(OWNER_TELEGRAM_ID);

class SwordsmithBot {
  private bot: TelegramBot;
  private syncService: TelegramSyncService;
  private commandHandler: CommandHandler;
  private isShuttingDown = false;

  constructor() {
    // Initialize bot with polling
    this.bot = new TelegramBot(BOT_TOKEN!, {
      polling: {
        interval: 1000,
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });

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

    this.setupErrorHandling();
    this.setupGracefulShutdown();
  }

  private setupErrorHandling(): void {
    // Handle polling errors
    this.bot.on('polling_error', (error) => {
      logger.error('Telegram polling error:', error);

      // Don't exit on ECONNRESET or temporary network issues
      if ((error as any).code === 'ETELEGRAM') {
        logger.warn('Telegram API error, will retry...');
        return;
      }

      // For other errors, we might want to restart
      if (!this.isShuttingDown) {
        logger.error('Critical polling error, considering restart');
      }
    });

    // Handle webhook errors (if using webhook mode)
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
      // Stop accepting new updates
      await this.bot.stopPolling();
      logger.info('Bot polling stopped');

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
      logger.info('Initializing Swordsmith Channel Search Bot...');

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

      logger.info('Swordsmith Channel Search Bot is now running!');

      // Set up periodic health checks
      this.setupHealthCheck();

    } catch (error) {
      logger.error('Failed to initialize bot:', error);
      throw error;
    }
  }

  private async sendStartupNotification(): Promise<void> {
    try {
      const stats = await database.get('SELECT COUNT(*) as total FROM channels WHERE is_active = 1');
      const uptime = process.uptime();

      const message = `🚀 *Bot Started Successfully*

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

  private setupHealthCheck(): void {
    // Run health check every 5 minutes
    setInterval(async () => {
      if (this.isShuttingDown) return;

      try {
        // Check database connection
        await database.get('SELECT 1');

        // Check bot connectivity
        await this.bot.getMe();

        logger.debug('Health check passed');
      } catch (error) {
        logger.error('Health check failed:', error);

        // Notify owner of health issues
        try {
          await this.bot.sendMessage(ownerTelegramId,
            `⚠️ *Health Check Failed*\n\nError: ${error}`,
            { parse_mode: 'MarkdownV2' }
          );
        } catch (notifyError) {
          logger.error('Failed to notify owner of health check failure:', notifyError);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Public methods for external access
  getBotInstance(): TelegramBot {
    return this.bot;
  }

  getSyncService(): TelegramSyncService {
    return this.syncService;
  }

  async getBotStats(): Promise<any> {
    try {
      const channelStats = await database.get(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN type = 'public' THEN 1 END) as public,
          COUNT(CASE WHEN type = 'private' THEN 1 END) as private,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active
        FROM channels
      `);

      const searchStats = await database.get(`
        SELECT COUNT(*) as searches FROM search_history
        WHERE searched_at >= datetime('now', '-7 days')
      `);

      const syncStatus = await this.syncService.getSyncStatus();

      return {
        channels: channelStats,
        searches: searchStats.searches || 0,
        sync: syncStatus,
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get bot stats:', error);
      throw error;
    }
  }
}

// Initialize and start the bot
async function main() {
  try {
    const bot = new SwordsmithBot();
    await bot.initialize();
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the bot
if (require.main === module) {
  main();
}

export { SwordsmithBot };