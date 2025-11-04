import TelegramBot from 'node-telegram-bot-api';
import logger from '../../../utils/logger';
import { MessageFormatter } from '../../../utils/MessageFormatter';
import { InlineKeyboards } from '../keyboards/InlineKeyboards';
import { channelModel } from '../../../models/Channel';

export class WelcomeHandler {
  async handleWelcome(msg: TelegramBot.Message): Promise<void> {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      const userName = msg.from?.first_name || 'there';

      logger.info(`Welcome message sent to user ${userId} (${userName})`);

      // Get bot statistics for dynamic welcome message
      const stats = await channelModel.getChannelStats();
      const searchStats = await channelModel.getSearchStats(7);

      // Create personalized welcome message
      const welcomeMessage = MessageFormatter.formatWelcomeMessage();

      // Add user's name to make it more personal
      const personalizedWelcome = `👋 Hello, ${MessageFormatter.escapeMarkdownV2(userName)}!

${welcomeMessage}

📊 *Currently indexing:* ${stats.active} active channels
🔍 *Searches this week:* ${searchStats}`;

      // Send welcome message with inline keyboard
      await msg.chat.telegram.sendMessage(chatId, personalizedWelcome, {
        parse_mode: 'MarkdownV2',
        reply_markup: InlineKeyboards.getWelcomeKeyboard()
      });

      // Update user session
      await channelModel.updateUserSession({
        user_id: userId!,
        last_command: 'start'
      });

    } catch (error) {
      logger.error('Error in welcome handler:', error);
      throw error;
    }
  }

  async handleWelcomeBack(chatId: number, userId: number, userName: string): Promise<void> {
    try {
      logger.info(`Welcome back message sent to user ${userId} (${userName})`);

      const welcomeMessage = MessageFormatter.formatWelcomeMessage();

      const welcomeBackMessage = `👋 Welcome back, ${MessageFormatter.escapeMarkdownV2(userName)}!

${welcomeMessage}`;

      // This would need bot instance passed in constructor or as parameter
      // For now, this is a placeholder method structure
      throw new Error('Bot instance not available in this method');
    } catch (error) {
      logger.error('Error in welcome back handler:', error);
      throw error;
    }
  }

  async handleNewChatMembers(msg: TelegramBot.Message): Promise<void> {
    try {
      const chatId = msg.chat.id;
      const newMembers = msg.new_chat_members || [];

      for (const member of newMembers) {
        if (member.is_bot) {
          // Bot was added to a group/channel
          logger.info(`Bot added to chat ${chatId} by ${member.first_name}`);
          // Could implement group-specific welcome here
        } else {
          // New user joined a group where bot is present
          logger.info(`New user ${member.first_name} joined chat ${chatId}`);
          // Could implement group member welcome here
        }
      }
    } catch (error) {
      logger.error('Error handling new chat members:', error);
      throw error;
    }
  }

  async handleLeftChatMember(msg: TelegramBot.Message): Promise<void> {
    try {
      const leftMember = msg.left_chat_member;
      if (leftMember) {
        logger.info(`User ${leftMember.first_name} left chat ${msg.chat.id}`);
        // Could implement leave message handling here
      }
    } catch (error) {
      logger.error('Error handling left chat member:', error);
      throw error;
    }
  }

  // Static method to escape markdown (since MessageFormatter might not be accessible)
  private static escapeMarkdownV2(text: string): string {
    const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
    return text.replace(new RegExp(`[${specialChars.join('\\\\')}]`, 'g'), '\\$&');
  }
}