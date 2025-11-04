import TelegramBot from 'node-telegram-bot-api';
import logger from '../../../utils/logger';
import { MessageFormatter } from '../../../utils/MessageFormatter';
import { InlineKeyboards } from '../keyboards/InlineKeyboards';
import { channelModel } from '../../../models/Channel';

export class SearchHandler {
  private maxResults: number;

  constructor() {
    this.maxResults = parseInt(process.env.MAX_SEARCH_RESULTS || '5');
  }

  async handleSearch(chatId: number, userId: number | undefined, query: string): Promise<void> {
    try {
      // Sanitize and validate search query
      const sanitizedQuery = MessageFormatter.sanitizeSearchQuery(query);

      if (!sanitizedQuery || sanitizedQuery.length < 1) {
        await this.promptForSearch(chatId);
        return;
      }

      logger.info(`Search query from user ${userId}: "${sanitizedQuery}"`);

      // Show loading message first
      const loadingMessage = await this.sendLoadingMessage(chatId);

      try {
        // Perform search
        const searchResults = await channelModel.searchChannels(sanitizedQuery, this.maxResults);

        // Get total results count (without limit)
        const allResults = await channelModel.searchChannels(sanitizedQuery, 1000);
        const totalResults = allResults.length;

        // Delete loading message
        await this.deleteMessage(chatId, loadingMessage.message_id);

        if (searchResults.length === 0) {
          await this.sendNoResultsMessage(chatId, sanitizedQuery);
        } else {
          await this.sendSearchResults(chatId, searchResults, sanitizedQuery, totalResults);
        }

        // Record search in history
        if (userId) {
          await channelModel.addSearchHistory({
            user_id: userId,
            query: sanitizedQuery,
            results_count: searchResults.length
          });
        }

        // Update user session
        if (userId) {
          await channelModel.updateUserSession({
            user_id: userId,
            last_command: 'search',
            search_query: sanitizedQuery
          });
        }

      } catch (searchError) {
        logger.error('Search operation failed:', searchError);

        // Delete loading message
        await this.deleteMessage(chatId, loadingMessage.message_id);

        await this.sendSearchErrorMessage(chatId, sanitizedQuery);
      }

    } catch (error) {
      logger.error('Error in search handler:', error);
      await this.sendSearchErrorMessage(chatId, query);
    }
  }

  async promptForSearch(chatId: number): Promise<void> {
    try {
      const promptMessage = MessageFormatter.formatSearchPrompt();

      await this.sendMessage(chatId, promptMessage, {
        reply_markup: InlineKeyboards.getSearchPromptKeyboard()
      });
    } catch (error) {
      logger.error('Error prompting for search:', error);
      throw error;
    }
  }

  async handleSearchByCategory(chatId: number, userId: number | undefined, category: string): Promise<void> {
    try {
      logger.info(`Category search from user ${userId}: "${category}"`);

      // For now, treat category as a search query
      // In the future, this could be enhanced with actual category filtering
      const categoryQueries = {
        'anime': 'anime',
        'swordsmithing': 'sword',
        'crafting': 'craft',
        'tutorials': 'tutorial',
        'news': 'news',
        'community': 'community'
      };

      const query = categoryQueries[category as keyof typeof categoryQueries] || category;
      await this.handleSearch(chatId, userId, query);

    } catch (error) {
      logger.error('Error in category search:', error);
      throw error;
    }
  }

  async handlePopularSearches(chatId: number, userId: number | undefined): Promise<void> {
    try {
      logger.info(`Popular searches requested by user ${userId}`);

      // For now, show some popular search terms
      const popularSearches = [
        'anime',
        'sword',
        'crafting',
        'tutorial',
        'traditional',
        'modern'
      ];

      const message = `🔥 *Popular Searches*

Here are some popular search terms:
${popularSearches.map(term => `• ${MessageFormatter.escapeMarkdownV2(term)}`).join('\n')}

Click any term above or type your own search!`;

      await this.sendMessage(chatId, message, {
        reply_markup: InlineKeyboards.getSearchPromptKeyboard()
      });

    } catch (error) {
      logger.error('Error showing popular searches:', error);
      throw error;
    }
  }

  private async sendLoadingMessage(chatId: number): Promise<TelegramBot.Message> {
    const loadingMessage = MessageFormatter.formatLoadingMessage('Searching channels...');
    return await this.sendMessage(chatId, loadingMessage);
  }

  private async sendSearchResults(
    chatId: number,
    channels: any[],
    query: string,
    totalResults: number
  ): Promise<void> {
    const resultsMessage = MessageFormatter.formatSearchResults(channels, query, totalResults);

    await this.sendMessage(chatId, resultsMessage, {
      reply_markup: InlineKeyboards.getSearchResultsKeyboard()
    });
  }

  private async sendNoResultsMessage(chatId: number, query: string): Promise<void> {
    const noResultsMessage = MessageFormatter.formatSearchResults([], query);

    await this.sendMessage(chatId, noResultsMessage, {
      reply_markup: InlineKeyboards.getSearchResultsKeyboard()
    });
  }

  private async sendSearchErrorMessage(chatId: number, query: string): Promise<void> {
    const errorMessage = MessageFormatter.formatErrorMessage(
      'Search Failed',
      `Sorry, the search for "${query}" failed. Please try again.`,
      'Check your spelling or try different keywords.'
    );

    await this.sendMessage(chatId, errorMessage, {
      reply_markup: InlineKeyboards.getErrorKeyboard()
    });
  }

  // Helper method to send messages (would need bot instance)
  private async sendMessage(
    chatId: number,
    text: string,
    options?: any
  ): Promise<TelegramBot.Message> {
    // This is a placeholder - in the actual implementation,
    // the bot instance would be passed to the handler or available via dependency injection
    throw new Error('Bot instance not available in this method');
  }

  // Helper method to delete messages
  private async deleteMessage(chatId: number, messageId: number): Promise<void> {
    // This is a placeholder - in the actual implementation,
    // the bot instance would be passed to the handler or available via dependency injection
    throw new Error('Bot instance not available in this method');
  }
}