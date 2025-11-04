import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

const DATABASE_PATH = process.env.DATABASE_PATH || './data/channels.db';

export class Database {
  private db: sqlite3.Database | null = null;

  async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(DATABASE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(DATABASE_PATH);

      // Enable foreign keys
      await this.run('PRAGMA foreign_keys = ON');

      // Create tables
      await this.createTables();

      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const channelsTable = `
      CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        username TEXT,
        description TEXT,
        type TEXT CHECK(type IN ('public', 'private')) NOT NULL,
        invite_link TEXT NOT NULL,
        member_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const searchHistoryTable = `
      CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        query TEXT NOT NULL,
        results_count INTEGER DEFAULT 0,
        searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const userSessionsTable = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        user_id INTEGER PRIMARY KEY,
        last_command TEXT,
        search_query TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_channels_telegram_id ON channels(telegram_id)',
      'CREATE INDEX IF NOT EXISTS idx_channels_name ON channels(name)',
      'CREATE INDEX IF NOT EXISTS idx_channels_username ON channels(username)',
      'CREATE INDEX IF NOT EXISTS idx_channels_type ON channels(type)',
      'CREATE INDEX IF NOT EXISTS idx_channels_active ON channels(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at)'
    ];

    await this.run(channelsTable);
    await this.run(searchHistoryTable);
    await this.run(userSessionsTable);

    for (const index of indexes) {
      await this.run(index);
    }
  }

  private run(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.db = null;
          resolve();
        }
      });
    });
  }
}

// Export singleton instance
export const database = new Database();