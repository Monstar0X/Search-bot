import TelegramBot from 'node-telegram-bot-api';
import logger from '../../utils/logger';
import { WelcomeHandler } from './WelcomeHandler';
import { SearchHandler } from './SearchHandler';
import { SupportHandler } from './SupportHandler';
import { AboutHandler } from './AboutHandler';

export class CommandHandler {
  private bot: TelegramBot;
  private welcomeHandler: WelcomeHandler;
  private searchHandler: SearchHandler;
  private supportHandler: SupportHandler;
  private aboutHandler: AboutHandler;

  constructor(
    bot: TelegramBot,
    welcomeHandler: WelcomeHandler,
    searchHandler: SearchHandler,
    supportHandler: SupportHandler,
    aboutHandler: AboutHandler
  ) {
    this.bot = bot;
    this.welcomeHandler = welcomeHandler;
    this.searchHandler = searchHandler;
    this.supportHandler = supportHandler;
    this.aboutHandler = aboutHandler;
  }

  initialize(): void {
    // Register command handlers
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStartCommand(msg);
    });

    this.bot.onText(/\/search(?:\s+(.+))?/, async (msg, match) => {
      await this.handleSearchCommand(msg, match);
    });

    this.bot.onText(/\/help/, async (msg) => {
      await this.handleHelpCommand(msg);
    });

    this.bot.onText(/\/about/, async (msg) => {
      await this.handleAboutCommand(msg);
    });

    this.bot.onText(/\/support/, async (msg) => {
      await this.handleSupportCommand(msg);
    });

    // Handle callback queries (inline button presses)
    this.bot.on('callback_query', async (callbackQuery) => {
      await this.handleCallbackQuery(callbackQuery);
    });

    // Handle regular text messages (for search functionality)
    this.bot.on('message', async (msg) => {
      await this.handleTextMessage(msg);
    });

    logger.info('Command handlers initialized');
  }

  private async handleStartCommand(msg: TelegramBot.Message): Promise<void> {
    try {
      logger.info(`Start command from user ${msg.from?.id} (${msg.from?.username})`);
      await this.welcomeHandler.handleWelcome(msg);
    } catch (error) {
      logger.error('Error handling start command:', error);
      await this.sendErrorMessage(msg.chat.id, 'Sorry, something went wrong. Please try again.');
    }
  }

  private async handleSearchCommand(msg: TelegramBot.Message, match: RegExpMatchArray | null): Promise<void> {
    try {
      const query = match?.[1]?.trim();
      logger.info(`Search command from user ${msg.from?.id}: ${query || '(no query)'}`);

      if (query) {
        await this.searchHandler.handleSearch(msg.chat.id, msg.from?.id, query);
      } else {
        await this.searchHandler.promptForSearch(msg.chat.id);
      }
    } catch (error) {
      logger.error('Error handling search command:', error);
      await this.sendErrorMessage(msg.chat.id, 'Search failed. Please try again.');
    }
  }

  private async handleHelpCommand(msg: TelegramBot.Message): Promise<void> {
    try {
      logger.info(`Help command from user ${msg.from?.id}`);
      await this.sendHelpMessage(msg.chat.id);
    } catch (error) {
      logger.error('Error handling help command:', error);
      await this.sendErrorMessage(msg.chat.id, 'Sorry, something went wrong. Please try again.');
    }
  }

  private async handleAboutCommand(msg: TelegramBot.Message): Promise<void> {
    try {
      logger.info(`About command from user ${msg.from?.id}`);
      await this.aboutHandler.handleAbout(msg.chat.id);
    } catch (error) {
      logger.error('Error handling about command:', error);
      await this.sendErrorMessage(msg.chat.id, 'Sorry, something went wrong. Please try again.');
    }
  }

  private async handleSupportCommand(msg: TelegramBot.Message): Promise<void> {
    try {
      logger.info(`Support command from user ${msg.from?.id}`);
      await this.supportHandler.handleSupport(msg.chat.id);
    } catch (error) {
      logger.error('Error handling support command:', error);
      await this.sendErrorMessage(msg.chat.id, 'Sorry, something went wrong. Please try again.');
    }
  }

  private async handleCallbackQuery(callbackQuery: TelegramBot.CallbackQuery): Promise<void> {
    try {
      const action = callbackQuery.data;
      const userId = callbackQuery.from.id;
      const chatId = callbackQuery.message?.chat.id;

      if (!chatId || !action) {
        await this.bot.answerCallbackQuery(callbackQuery.id, 'Invalid request');
        return;
      }

      logger.info(`Callback query from user ${userId}: ${action}`);

      // Answer the callback query to remove loading state
      await this.bot.answerCallbackQuery(callbackQuery.id);

      // Handle different callback actions
      switch (action) {
        case 'search_channels':
          await this.searchHandler.promptForSearch(chatId);
          break;

        case 'about_bot':
          await this.aboutHandler.handleAbout(chatId);
          break;

        case 'support_help':
          await this.supportHandler.handleSupport(chatId);
          break;

        case 'help_menu':
          await this.sendHelpMessage(chatId);
          break;

        case 'main_menu':
          await this.welcomeHandler.handleWelcome({ chat: { id: chatId }, from: callbackQuery.from } as TelegramBot.Message);
          break;

        case 'stats_info':
          await this.aboutHandler.handleAbout(chatId);
          break;

        default:
          // Handle unknown callbacks
          logger.warn(`Unknown callback action: ${action}`);
          await this.bot.sendMessage(chatId, 'Sorry, this action is not available.');
      }
    } catch (error) {
      logger.error('Error handling callback query:', error);
      const chatId = callbackQuery.message?.chat.id;
      if (chatId) {
        await this.sendErrorMessage(chatId, 'Sorry, something went wrong. Please try again.');
      }
    }
  }

  private async handleTextMessage(msg: TelegramBot.Message): Promise<void> {
    try {
      // Skip if message is a command
      if (msg.text?.startsWith('/')) {
        return;
      }

      // Skip if message has no text
      if (!msg.text) {
        return;
      }

      const userId = msg.from?.id;
      const chatId = msg.chat.id;
      const text = msg.text.trim();

      logger.info(`Text message from user ${userId}: "${text}"`);

      // Check if user is in search mode by checking their session
      // This would require implementing session checking logic
      // For now, treat any non-command text as a search query
      if (text.length > 0) {
        await this.searchHandler.handleSearch(chatId, userId, text);
      }
    } catch (error) {
      logger.error('Error handling text message:', error);
      // Don't send error messages for every text message to avoid spam
    }
  }

  private async sendHelpMessage(chatId: number): Promise<void> {
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

    await this.bot.sendMessage(chatId, helpMessage, {
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard
    });
  }

  private async sendErrorMessage(chatId: number, message: string): Promise<void> {
    const errorMessage = `❌ *Error*

${message}

If the problem persists, please use /support for help.`;

    await this.bot.sendMessage(chatId, errorMessage, {
      parse_mode: 'MarkdownV2'
    });
  }

  // Admin command handlers (owner only)
  async handleAdminCommand(msg: TelegramBot.Message, command: string): Promise<void> {
    const ownerTelegramId = parseInt(process.env.OWNER_TELEGRAM_ID || '0');

    if (msg.from?.id !== ownerTelegramId) {
      await this.bot.sendMessage(msg.chat.id, '❌ This command is only available to the bot owner.');
      return;
    }

    try {
      switch (command) {
        case '/sync':
          // Handle manual sync (would need access to sync service)
          await this.bot.sendMessage(msg.chat.id, '🔄 Manual sync not yet implemented');
          break;

        case '/stats':
          // Handle stats command
          await this.aboutHandler.handleAbout(msg.chat.id);
          break;

        default:
          await this.bot.sendMessage(msg.chat.id, '❌ Unknown admin command');
      }
    } catch (error) {
      logger.error('Error handling admin command:', error);
      await this.bot.sendMessage(msg.chat.id, '❌ Admin command failed');
    }
  }
}