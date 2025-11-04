import { database } from '../config/database';
import logger from '../utils/logger';

export interface Channel {
  id?: number;
  telegram_id: number;
  name: string;
  username?: string;
  description?: string;
  type: 'public' | 'private';
  invite_link: string;
  member_count: number;
  is_active: boolean;
  added_at?: string;
  last_updated?: string;
}

export interface SearchHistory {
  id?: number;
  user_id: number;
  query: string;
  results_count: number;
  searched_at?: string;
}

export interface UserSession {
  user_id: number;
  last_command?: string;
  search_query?: string;
  created_at?: string;
  updated_at?: string;
}

export class ChannelModel {
  async addChannel(channel: Omit<Channel, 'id' | 'added_at' | 'last_updated'>): Promise<number> {
    try {
      const sql = `
        INSERT INTO channels (telegram_id, name, username, description, type, invite_link, member_count, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(telegram_id) DO UPDATE SET
          name = excluded.name,
          username = excluded.username,
          description = excluded.description,
          type = excluded.type,
          invite_link = excluded.invite_link,
          member_count = excluded.member_count,
          is_active = excluded.is_active,
          last_updated = CURRENT_TIMESTAMP
      `;

      await (database as any).run(sql, [
        channel.telegram_id,
        channel.name,
        channel.username || null,
        channel.description || null,
        channel.type,
        channel.invite_link,
        channel.member_count,
        channel.is_active ? 1 : 0
      ]);

      logger.info(`Channel added/updated: ${channel.name} (${channel.telegram_id})`);
      return channel.telegram_id;
    } catch (error) {
      logger.error('Failed to add channel:', error);
      throw error;
    }
  }

  async getAllChannels(activeOnly: boolean = true): Promise<Channel[]> {
    try {
      const sql = activeOnly
        ? 'SELECT * FROM channels WHERE is_active = 1 ORDER BY name'
        : 'SELECT * FROM channels ORDER BY name';

      const rows = await database.all(sql);
      return rows.map(this.mapRowToChannel);
    } catch (error) {
      logger.error('Failed to get all channels:', error);
      throw error;
    }
  }

  async getChannelById(telegramId: number): Promise<Channel | null> {
    try {
      const sql = 'SELECT * FROM channels WHERE telegram_id = ?';
      const row = await database.get(sql, [telegramId]);
      return row ? this.mapRowToChannel(row) : null;
    } catch (error) {
      logger.error('Failed to get channel by ID:', error);
      throw error;
    }
  }

  async searchChannels(query: string, limit: number = 5): Promise<Channel[]> {
    try {
      const sql = `
        SELECT * FROM channels
        WHERE is_active = 1 AND (
          LOWER(name) LIKE LOWER(?) OR
          LOWER(description) LIKE LOWER(?) OR
          LOWER(username) LIKE LOWER(?)
        )
        ORDER BY
          CASE WHEN LOWER(name) LIKE LOWER(?) THEN 1 ELSE 2 END,
          name
        LIMIT ?
      `;

      const searchTerm = `%${query}%`;
      const exactMatch = `${query}%`;

      const rows = await database.all(sql, [
        searchTerm, searchTerm, searchTerm, exactMatch, limit
      ]);

      return rows.map(this.mapRowToChannel);
    } catch (error) {
      logger.error('Failed to search channels:', error);
      throw error;
    }
  }

  async getChannelStats(): Promise<{
    total: number;
    public: number;
    private: number;
    active: number;
  }> {
    try {
      const statsSql = `
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN type = 'public' THEN 1 END) as public,
          COUNT(CASE WHEN type = 'private' THEN 1 END) as private,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active
        FROM channels
      `;

      const stats = await database.get(statsSql);
      return {
        total: stats.total || 0,
        public: stats.public || 0,
        private: stats.private || 0,
        active: stats.active || 0
      };
    } catch (error) {
      logger.error('Failed to get channel stats:', error);
      throw error;
    }
  }

  async deactivateChannel(telegramId: number): Promise<void> {
    try {
      const sql = 'UPDATE channels SET is_active = 0, last_updated = CURRENT_TIMESTAMP WHERE telegram_id = ?';
      await (database as any).run(sql, [telegramId]);
      logger.info(`Channel deactivated: ${telegramId}`);
    } catch (error) {
      logger.error('Failed to deactivate channel:', error);
      throw error;
    }
  }

  async deleteChannel(telegramId: number): Promise<void> {
    try {
      const sql = 'DELETE FROM channels WHERE telegram_id = ?';
      await (database as any).run(sql, [telegramId]);
      logger.info(`Channel deleted: ${telegramId}`);
    } catch (error) {
      logger.error('Failed to delete channel:', error);
      throw error;
    }
  }

  async getLastSyncTime(): Promise<string | null> {
    try {
      const sql = 'SELECT MAX(last_updated) as last_sync FROM channels WHERE is_active = 1';
      const result = await database.get(sql);
      return result?.last_sync || null;
    } catch (error) {
      logger.error('Failed to get last sync time:', error);
      throw error;
    }
  }

  async addSearchHistory(searchHistory: Omit<SearchHistory, 'id' | 'searched_at'>): Promise<void> {
    if (process.env.SEARCH_HISTORY_ENABLED !== 'true') return;

    try {
      const sql = `
        INSERT INTO search_history (user_id, query, results_count)
        VALUES (?, ?, ?)
      `;

      await (database as any).run(sql, [
        searchHistory.user_id,
        searchHistory.query,
        searchHistory.results_count
      ]);
    } catch (error) {
      logger.error('Failed to add search history:', error);
      // Don't throw error for search history to avoid breaking main functionality
    }
  }

  async getSearchStats(days: number = 7): Promise<number> {
    try {
      const sql = `
        SELECT COUNT(*) as count FROM search_history
        WHERE searched_at >= datetime('now', '-${days} days')
      `;
      const result = await database.get(sql);
      return result?.count || 0;
    } catch (error) {
      logger.error('Failed to get search stats:', error);
      return 0;
    }
  }

  async updateUserSession(session: UserSession): Promise<void> {
    try {
      const sql = `
        INSERT OR REPLACE INTO user_sessions (user_id, last_command, search_query, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `;

      await (database as any).run(sql, [
        session.user_id,
        session.last_command || null,
        session.search_query || null
      ]);
    } catch (error) {
      logger.error('Failed to update user session:', error);
      // Don't throw error for user sessions to avoid breaking main functionality
    }
  }

  async getUserSession(userId: number): Promise<UserSession | null> {
    try {
      const sql = 'SELECT * FROM user_sessions WHERE user_id = ?';
      const row = await database.get(sql, [userId]);
      return row || null;
    } catch (error) {
      logger.error('Failed to get user session:', error);
      return null;
    }
  }

  private mapRowToChannel(row: any): Channel {
    return {
      id: row.id,
      telegram_id: row.telegram_id,
      name: row.name,
      username: row.username,
      description: row.description,
      type: row.type,
      invite_link: row.invite_link,
      member_count: row.member_count,
      is_active: Boolean(row.is_active),
      added_at: row.added_at,
      last_updated: row.last_updated
    };
  }
}

export const channelModel = new ChannelModel();