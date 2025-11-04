import TelegramBot from 'node-telegram-bot-api';
import { channelModel, Channel } from '../models/Channel';
import logger from '../utils/logger';

export interface SyncOptions {
  fullSync?: boolean;
  channelIds?: number[];
}

export class TelegramSyncService {
  private bot: TelegramBot;
  private ownerTelegramId: number;
  private syncInProgress = false;
  private syncInterval?: NodeJS.Timeout;
  private quickSyncInterval?: NodeJS.Timeout;

  constructor(bot: TelegramBot, ownerTelegramId: number) {
    this.bot = bot;
    this.ownerTelegramId = ownerTelegramId;
  }

  async initializeScheduledSync(): Promise<void> {
    const syncIntervalHours = parseInt(process.env.SYNC_INTERVAL_HOURS || '24');
    const quickSyncIntervalHours = parseInt(process.env.QUICK_SYNC_INTERVAL_HOURS || '6');

    // Schedule full sync
    this.syncInterval = setInterval(async () => {
      logger.info('Starting scheduled full sync');
      await this.performSync({ fullSync: true });
    }, syncIntervalHours * 60 * 60 * 1000);

    // Schedule quick sync
    this.quickSyncInterval = setInterval(async () => {
      logger.info('Starting scheduled quick sync');
      await this.performSync({ fullSync: false });
    }, quickSyncIntervalHours * 60 * 60 * 1000);

    logger.info(`Scheduled sync initialized: Full sync every ${syncIntervalHours}h, Quick sync every ${quickSyncIntervalHours}h`);
  }

  async performSync(options: SyncOptions = {}): Promise<{
    added: number;
    updated: number;
    deactivated: number;
    errors: string[];
  }> {
    if (this.syncInProgress) {
      logger.warn('Sync already in progress, skipping');
      return { added: 0, updated: 0, deactivated: 0, errors: ['Sync already in progress'] };
    }

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      logger.info(`Starting ${options.fullSync ? 'full' : 'quick'} sync`);

      const result = {
        added: 0,
        updated: 0,
        deactivated: 0,
        errors: [] as string[]
      };

      // Get existing channels from database
      const existingChannels = await channelModel.getAllChannels();
      const existingChannelIds = new Set(existingChannels.map(ch => ch.telegram_id));

      // Get channels to sync (either specific ones or all)
      let channelsToSync: Channel[];

      if (options.channelIds && options.channelIds.length > 0) {
        // Sync specific channels
        channelsToSync = existingChannels.filter(ch => options.channelIds!.includes(ch.telegram_id));
      } else {
        // Discover and sync all channels
        channelsToSync = await this.discoverOwnedChannels();
      }

      logger.info(`Found ${channelsToSync.length} channels to sync`);

      for (const channel of channelsToSync) {
        try {
          // Get fresh channel data from Telegram
          const freshChannelData = await this.getChannelData(channel.telegram_id);

          if (!freshChannelData) {
            // Channel might be inaccessible, deactivate it
            if (existingChannelIds.has(channel.telegram_id)) {
              await channelModel.deactivateChannel(channel.telegram_id);
              result.deactivated++;
              logger.warn(`Deactivated inaccessible channel: ${channel.name} (${channel.telegram_id})`);
            }
            continue;
          }

          // Add or update channel in database
          await channelModel.addChannel(freshChannelData);

          if (existingChannelIds.has(channel.telegram_id)) {
            result.updated++;
            logger.debug(`Updated channel: ${freshChannelData.name}`);
          } else {
            result.added++;
            logger.debug(`Added new channel: ${freshChannelData.name}`);
          }

          // Remove from existing set to track which channels are no longer accessible
          existingChannelIds.delete(channel.telegram_id);

        } catch (error) {
          const errorMsg = `Failed to sync channel ${channel.name} (${channel.telegram_id}): ${error}`;
          logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      // Deactivate channels that are no longer accessible (only for full sync)
      if (options.fullSync) {
        for (const channelId of existingChannelIds) {
          try {
            await channelModel.deactivateChannel(channelId);
            result.deactivated++;
            logger.info(`Deactivated channel no longer accessible: ${channelId}`);
          } catch (error) {
            const errorMsg = `Failed to deactivate channel ${channelId}: ${error}`;
            logger.error(errorMsg);
            result.errors.push(errorMsg);
          }
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`Sync completed in ${duration}ms: Added ${result.added}, Updated ${result.updated}, Deactivated ${result.deactivated}, Errors: ${result.errors.length}`);

      return result;

    } catch (error) {
      logger.error('Sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async discoverOwnedChannels(): Promise<Channel[]> {
    const channels: Channel[] = [];

    // This is a simplified implementation
    // In a real scenario, you would:
    // 1. Use a list of known channel IDs
    // 2. Or use Telegram's getUpdates to find where the bot is added
    // 3. Or maintain a configuration file with channel list

    // For now, we'll assume channels are pre-configured or discovered through bot being added
    // This is where you would implement your specific channel discovery logic

    logger.warn('Channel discovery not fully implemented - using placeholder logic');

    return channels;
  }

  private async getChannelData(channelId: number): Promise<Channel | null> {
    try {
      // Get channel info
      const chat = await this.bot.getChat(channelId);

      // Get member count (may not always be available for private channels)
      let memberCount = 0;
      try {
        const chatMembersCount = await this.bot.getChatMemberCount(channelId);
        memberCount = chatMembersCount;
      } catch (error) {
        logger.debug(`Could not get member count for channel ${channelId}: ${error}`);
      }

      // Determine if channel is public or private
      const isPublic = !!chat.username;
      const channelType: 'public' | 'private' = isPublic ? 'public' : 'private';

      // Generate invite link
      let inviteLink = '';
      try {
        if (isPublic) {
          inviteLink = `https://t.me/${chat.username}`;
        } else {
          // For private channels, try to get or create invite link
          const invite = await this.bot.createChatInviteLink(channelId, {
            member_limit: 1 // Create one-time use invite links
          });
          inviteLink = invite.invite_link;
        }
      } catch (error) {
        logger.error(`Failed to get invite link for channel ${channelId}: ${error}`);
        return null; // Can't proceed without invite link
      }

      return {
        telegram_id: chat.id,
        name: chat.title || `Channel ${chat.id}`,
        username: chat.username || undefined,
        description: chat.description || undefined,
        type: channelType,
        invite_link: inviteLink,
        member_count: memberCount,
        is_active: true
      };

    } catch (error) {
      logger.error(`Failed to get channel data for ${channelId}: ${error}`);
      return null;
    }
  }

  async manualSyncChannel(channelId: number): Promise<boolean> {
    try {
      logger.info(`Starting manual sync for channel ${channelId}`);
      const result = await this.performSync({ channelIds: [channelId] });
      return result.errors.length === 0 && (result.added > 0 || result.updated > 0);
    } catch (error) {
      logger.error(`Manual sync failed for channel ${channelId}: ${error}`);
      return false;
    }
  }

  async getSyncStatus(): Promise<{
    lastSync: string | null;
    totalChannels: number;
    activeChannels: number;
    syncInProgress: boolean;
  }> {
    try {
      const lastSync = await channelModel.getLastSyncTime();
      const stats = await channelModel.getChannelStats();

      return {
        lastSync,
        totalChannels: stats.total,
        activeChannels: stats.active,
        syncInProgress: this.syncInProgress
      };
    } catch (error) {
      logger.error('Failed to get sync status:', error);
      return {
        lastSync: null,
        totalChannels: 0,
        activeChannels: 0,
        syncInProgress: this.syncInProgress
      };
    }
  }

  stopScheduledSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
    if (this.quickSyncInterval) {
      clearInterval(this.quickSyncInterval);
      this.quickSyncInterval = undefined;
    }
    logger.info('Scheduled sync stopped');
  }

  // Helper method to add channels manually (useful for initial setup)
  async addChannelManually(channelInfo: {
    telegram_id: number;
    name: string;
    username?: string;
    description?: string;
    type: 'public' | 'private';
    invite_link: string;
  }): Promise<boolean> {
    try {
      const channel: Channel = {
        ...channelInfo,
        member_count: 0,
        is_active: true
      };

      await channelModel.addChannel(channel);
      logger.info(`Manually added channel: ${channel.name}`);
      return true;
    } catch (error) {
      logger.error(`Failed to manually add channel: ${error}`);
      return false;
    }
  }
}