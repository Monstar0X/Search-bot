import { InlineKeyboardMarkup } from 'node-telegram-bot-api';

export class InlineKeyboards {
  // Main welcome menu keyboard
  static getWelcomeKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '🔍 Search Channels', callback_data: 'search_channels' },
          { text: 'ℹ️ About Bot', callback_data: 'about_bot' }
        ],
        [
          { text: '🆘 Help & Support', callback_data: 'support_help' },
          { text: '📊 Statistics', callback_data: 'stats_info' }
        ]
      ]
    };
  }

  // Help menu keyboard
  static getHelpKeyboard(): InlineKeyboardMarkup {
    return {
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
  }

  // Support menu keyboard
  static getSupportKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '📚 View Help', callback_data: 'help_menu' },
          { text: 'ℹ️ About Bot', callback_data: 'about_bot' }
        ],
        [
          { text: '🔍 Search Channels', callback_data: 'search_channels' },
          { text: '🏠 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    };
  }

  // About page keyboard
  static getAboutKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '🔍 Search Channels', callback_data: 'search_channels' },
          { text: '🆘 Support', callback_data: 'support_help' }
        ],
        [
          { text: '📚 Help', callback_data: 'help_menu' },
          { text: '🏠 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    };
  }

  // Search results keyboard
  static getSearchResultsKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '🔍 New Search', callback_data: 'search_channels' },
          { text: '📚 Help', callback_data: 'help_menu' }
        ],
        [
          { text: '🏠 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    };
  }

  // Search prompt keyboard
  static getSearchPromptKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '🏠 Back to Menu', callback_data: 'main_menu' },
          { text: '📚 Help', callback_data: 'help_menu' }
        ]
      ]
    };
  }

  // Error message keyboard
  static getErrorKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '🏠 Main Menu', callback_data: 'main_menu' },
          { text: '🆘 Support', callback_data: 'support_help' }
        ]
      ]
    };
  }

  // Admin keyboard (owner only)
  static getAdminKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '🔄 Sync Channels', callback_data: 'admin_sync' },
          { text: '📊 View Stats', callback_data: 'admin_stats' }
        ],
        [
          { text: '🏠 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    };
  }

  // Channel action keyboard (for future features)
  static getChannelActionKeyboard(channelId: string): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '📖 View Details', callback_data: `channel_details_${channelId}` },
          { text: '🔗 Join Channel', url: `https://t.me/${channelId}` }
        ],
        [
          { text: '🔍 Search More', callback_data: 'search_channels' },
          { text: '🏠 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    };
  }

  // Category search keyboard (for future category browsing)
  static getCategoryKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '🎌 Anime', callback_data: 'category_anime' },
          { text: '⚔️ Swordsmithing', callback_data: 'category_swordsmithing' }
        ],
        [
          { text: '🔨 Crafting', callback_data: 'category_crafting' },
          { text: '📚 Tutorials', callback_data: 'category_tutorials' }
        ],
        [
          { text: '📰 News', callback_data: 'category_news' },
          { text: '👥 Community', callback_data: 'category_community' }
        ],
        [
          { text: '🔍 Search All', callback_data: 'search_channels' },
          { text: '🏠 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    };
  }

  // Confirmation keyboard for admin actions
  static getConfirmationKeyboard(action: string): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '✅ Yes', callback_data: `confirm_${action}` },
          { text: '❌ No', callback_data: `cancel_${action}` }
        ]
      ]
    };
  }

  // Loading keyboard (disabled buttons)
  static getLoadingKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '⏳ Loading...', callback_data: 'loading' }
        ]
      ]
    };
  }
}