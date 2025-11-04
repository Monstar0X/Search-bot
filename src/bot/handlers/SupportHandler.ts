import TelegramBot from 'node-telegram-bot-api';
import logger from '../../utils/logger';
import { MessageFormatter } from '../../utils/MessageFormatter';
import { InlineKeyboards } from '../keyboards/InlineKeyboards';

export class SupportHandler {
  private bot: TelegramBot;

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  async handleSupport(chatId: number): Promise<void> {
    try {
      logger.info(`Support message sent to chat ${chatId}`);

      const supportMessage = MessageFormatter.formatSupportMessage();

      await this.sendMessage(chatId, supportMessage, {
        reply_markup: InlineKeyboards.getSupportKeyboard()
      });
    } catch (error) {
      logger.error('Error in support handler:', error);
      throw error;
    }
  }

  async handleContactOwner(chatId: number, userId: number | undefined, userName: string): Promise<void> {
    try {
      logger.info(`User ${userId} (${userName}) wants to contact owner`);

      const message = `📞 *Contact Bot Owner*

To get in touch with the bot owner, you can:

🔹 *Telegram:* @your_username_here
🔹 *Email:* support@example.com
🔹 *Issue Report:* Create an issue on our GitHub

*Please include:*
• Your username: @${MessageFormatter.escapeMarkdownV2(userName)}
• Description of the issue
• Any error messages you received

*Response time:* Usually within 24 hours`;

      await this.sendMessage(chatId, message, {
        reply_markup: InlineKeyboards.getSupportKeyboard()
      });
    } catch (error) {
      logger.error('Error handling contact owner:', error);
      throw error;
    }
  }

  async handleReportIssue(chatId: number, userId: number | undefined): Promise<void> {
    try {
      logger.info(`User ${userId} wants to report an issue`);

      const message = `🐛 *Report an Issue*

Please describe the issue you're experiencing:

1️⃣ *What happened?*
2️⃣ *What did you expect to happen?*
3️⃣ *Steps to reproduce the problem*

*Important information to include:*
• Your username: @${userId ? 'your_username' : 'unknown'}
• Command you were using
• Any error messages
• Device/app you're using

You can send this information directly here, and the bot owner will receive it.`;

      await this.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📧 Send Email Report', url: 'mailto:support@example.com?subject=Bot Issue Report' },
              { text: '🔙 Back to Support', callback_data: 'support_help' }
            ]
          ]
        }
      });

      // Update user session to expect issue report
      if (userId) {
        // This would need channelModel access
        logger.info(`User ${userId} in issue reporting mode`);
      }
    } catch (error) {
      logger.error('Error handling report issue:', error);
      throw error;
    }
  }

  async handleFAQ(chatId: number, question: string): Promise<void> {
    try {
      logger.info(`FAQ requested: ${question}`);

      const faqAnswers: { [key: string]: string } = {
        'private': `🔒 *Private Channels*

Private channels require an invitation link to join.
When you click the link, you'll need to request access from the channel administrators.

*Steps to join:*
1. Click the invitation link
2. Tap "Request to Join"
3. Wait for admin approval
4. You'll receive a notification when approved`,

        'search': `🔍 *Search Tips*

*How to search effectively:*
• Use specific keywords (e.g., "anime swords" instead of "anime")
• Try different terms if you don't find results
• Search works with partial matches
• Both channel names and descriptions are searched

*Example searches:*
• "anime" - finds anime-related channels
• "sword" - finds swordsmithing channels
• "tutorial" - finds educational content`,

        'not_found': `🔍 *No Channels Found*

If you're not finding channels, try these suggestions:

1. *Check spelling* - Make sure your search terms are spelled correctly
2. *Use broader terms* - Try "sword" instead of "katana forging"
3. *Try different keywords* - "crafting" instead of "smithing"
4. *Browse categories* - Use the category buttons if available

*Still can't find what you're looking for?*
Contact support for personalized recommendations.`,

        'bot_down': `🤖 *Bot Not Working*

If the bot isn't responding:

1. *Wait a few minutes* - The bot might be temporarily busy
2. *Try /start* - Return to the main menu
3. *Check your internet connection*
4. *Update Telegram* - Make sure you have the latest version

*If problems persist:*
• Contact support: /support
• Try again later - we're probably fixing it!`,

        'suggest': `💡 *Suggest a Channel*

We'd love to hear your channel suggestions!

*How to suggest:*
1. *Channel name:* What's the channel called?
2. *Channel description:* What's it about?
3. *Why suggest it?* Why should we include it?
4. *Channel link:* @username or invite link

*Send your suggestions to:* @your_username_here

*Note:* Only channels related to anime, swordsmithing, or similar topics will be considered.`
      };

      // Find the best matching FAQ answer
      let answer = faqAnswers['search']; // Default
      const lowerQuestion = question.toLowerCase();

      for (const [key, value] of Object.entries(faqAnswers)) {
        if (lowerQuestion.includes(key)) {
          answer = value;
          break;
        }
      }

      await this.sendMessage(chatId, answer, {
        reply_markup: InlineKeyboards.getSupportKeyboard()
      });
    } catch (error) {
      logger.error('Error handling FAQ:', error);
      throw error;
    }
  }

  async handleGeneralHelp(chatId: number): Promise<void> {
    try {
      logger.info(`General help requested for chat ${chatId}`);

      const helpMessage = `🆘 *General Help*

*Quick Guide:*

1️⃣ *Start* - Use /start to see the main menu
2️⃣ *Search* - Click "🔍 Search Channels" or type what you're looking for
3️⃣ *Navigate* - Use the inline buttons to move between sections
4️⃣ *Join* - Click on channel links to join (private channels need approval)

*Common Commands:*
/start - Main menu
/search - Search channels
/about - Bot information
/support - Get help
/help - This help message

*Need more help?*
Use the buttons below or contact support directly.`;

      await this.sendMessage(chatId, helpMessage, {
        reply_markup: InlineKeyboards.getSupportKeyboard()
      });
    } catch (error) {
      logger.error('Error in general help:', error);
      throw error;
    }
  }

  // Helper method to send messages
  private async sendMessage(
    chatId: number,
    text: string,
    options?: any
  ): Promise<TelegramBot.Message> {
    return await this.bot.sendMessage(chatId, text, {
      parse_mode: 'MarkdownV2',
      ...options
    });
  }
}