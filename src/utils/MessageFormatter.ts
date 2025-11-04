import { Channel } from '../models/Channel';

export class MessageFormatter {
  // Escape special characters for MarkdownV2
  static escapeMarkdownV2(text: string): string {
    const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
    return text.replace(new RegExp(`[${specialChars.join('\\\\')}]`, 'g'), '\\$&');
  }

  // Format welcome message with rich styling
  static formatWelcomeMessage(): string {
    const title = this.escapeMarkdownV2('Welcome to Swordsmith Channel Search Bot');
    const subtitle = this.escapeMarkdownV2('Discover amazing anime and swordsmithing channels!');
    const description = this.escapeMarkdownV2('This bot helps you find the best channels from our curated collection of 200+ channels.');
    const instruction = this.escapeMarkdownV2('Choose an option below to get started:');

    return `🎌 *${title}*

🔍 ${subtitle}

${description}

*${instruction}*`;
  }

  // Format search results with channel information
  static formatSearchResults(channels: Channel[], query: string, totalResults?: number): string {
    if (channels.length === 0) {
      const noResultsText = this.escapeMarkdownV2('No channels found. Try different keywords!');
      return `🔍 *No Results*

${noResultsText}`;
    }

    const escapedQuery = this.escapeMarkdownV2(query);
    const header = totalResults
      ? `🔍 *Found ${totalResults} results for "${escapedQuery}":*`
      : `🔍 *Results for "${escapedQuery}":*`;

    const channelResults = channels.map((channel, index) => {
      const number = this.escapeMarkdownV2(`${index + 1}`);
      const name = this.escapeMarkdownV2(channel.name);
      const description = channel.description
        ? this.escapeMarkdownV2(channel.description)
        : this.escapeMarkdownV2('No description available');

      const typeIcon = channel.type === 'public' ? '🌐' : '🔒';
      const memberCount = channel.member_count > 0
        ? this.formatNumber(channel.member_count)
        : 'N/A';

      const memberText = this.escapeMarkdownV2(`${memberCount} members`);
      const typeText = this.escapeMarkdownV2(channel.type);

      // Format invite link based on channel type
      let linkText: string;
      if (channel.type === 'public') {
        linkText = this.escapeMarkdownV2(`t.me/${channel.username}`);
      } else {
        linkText = this.escapeMarkdownV2('Private Link - Request Access');
      }

      return `${index + 1}️⃣ *${name}*
   ${description}
   🔗 Join: [${linkText}](${channel.invite_link})
   ${typeIcon} ${memberText} • ${typeText}`;
    }).join('\n\n');

    const footerText = this.escapeMarkdownV2('Continue searching with new query');
    const footer = `\n\n\n[Continue searching with new query]`;

    return `${header}

${channelResults}

*${footerText}*`;
  }

  // Format individual channel information
  static formatChannelInfo(channel: Channel): string {
    const name = this.escapeMarkdownV2(channel.name);
    const description = channel.description
      ? this.escapeMarkdownV2(channel.description)
      : this.escapeMarkdownV2('No description available');

    const typeIcon = channel.type === 'public' ? '🌐' : '🔒';
    const memberCount = channel.member_count > 0
      ? this.formatNumber(channel.member_count)
      : 'N/A';

    const memberText = this.escapeMarkdownV2(`${memberCount} members`);
    const typeText = this.escapeMarkdownV2(channel.type);

    // Format invite link based on channel type
    let linkText: string;
    if (channel.type === 'public') {
      linkText = this.escapeMarkdownV2(`t.me/${channel.username}`);
    } else {
      linkText = this.escapeMarkdownV2('Private Link - Request Access');
    }

    return `ℹ️ *Channel Information*

*${name}*

📝 ${description}

🔗 *Join Link:* [${linkText}](${channel.invite_link})
${typeIcon} *Members:* ${memberText}
📊 *Type:* ${typeText}`;
  }

  // Format about message with statistics
  static formatAboutMessage(stats: {
    total: number;
    public: number;
    private: number;
    active: number;
  }, lastSync: string | null, searchStats: number): string {
    const title = this.escapeMarkdownV2('About Swordsmith Channel Search Bot');
    const version = this.escapeMarkdownV2('1.0.0');
    const created = this.escapeMarkdownV2('2025');
    const developer = this.escapeMarkdownV2('Swordsmith Community');

    const statsTitle = this.escapeMarkdownV2('Bot Statistics:');
    const totalChannels = this.escapeMarkdownV2(`${stats.total}`);
    const publicChannels = this.escapeMarkdownV2(`${stats.public}`);
    const privateChannels = this.escapeMarkdownV2(`${stats.private}`);
    const activeChannels = this.escapeMarkdownV2(`${stats.active}`);

    const lastSyncText = lastSync
      ? this.escapeMarkdownV2(this.formatRelativeTime(lastSync))
      : this.escapeMarkdownV2('Never');

    const searchCount = this.escapeMarkdownV2(`${searchStats}`);
    const searchPeriod = this.escapeMarkdownV2('this week');

    const featuresTitle = this.escapeMarkdownV2('What this bot does:');
    const features = [
      'Automatically indexes 200+ owned channels',
      'Instant search across all channel types',
      'Provides join links for public channels',
      'Facilitates access requests for private channels',
      'Rich formatting and interactive interface'
    ].map(f => `✅ ${this.escapeMarkdownV2(f)}`).join('\n');

    const footer = this.escapeMarkdownV2('Made with ❤️ for the anime and swordsmithing community');

    return `ℹ️ *${title}*

🎌 *Version:* ${version}
📅 *Created:* ${created}
👤 *Developer:* ${developer}

*${statsTitle}*
📊 Total Channels: ${totalChannels}
   • Public: ${publicChannels} channels
   • Private: ${privateChannels} channels
🕒 Last Sync: ${lastSyncText}
🔍 Total Searches: ${searchCount} ${searchPeriod}

*${featuresTitle}*
${features}

*${footer}*`;
  }

  // Format support message with FAQ
  static formatSupportMessage(): string {
    const title = this.escapeMarkdownV2('Support & Help');
    const faqTitle = this.escapeMarkdownV2('Frequently Asked Questions:');

    const faq = [
      {
        q: 'How do I join private channels?',
        a: 'Click the link and request access. Admins review requests.'
      },
      {
        q: 'Can I suggest channels?',
        a: 'Contact @owner_username with suggestions.'
      },
      {
        q: 'Bot not working?',
        a: 'Try /start or contact support below.'
      }
    ].map(item => {
      const question = this.escapeMarkdownV2(item.q);
      const answer = this.escapeMarkdownV2(item.a);
      return `❓ *${question}*\n   → ${answer}`;
    }).join('\n\n');

    const needHelpTitle = this.escapeMarkdownV2('Need more help?');
    const ownerLabel = this.escapeMarkdownV2('Owner:');
    const ownerUsername = this.escapeMarkdownV2('@your_username_here');
    const responseTimeLabel = this.escapeMarkdownV2('Response time:');
    const responseTime = this.escapeMarkdownV2('Usually within 24 hours');

    return `🆘 *${title}*

*${faqTitle}*
${faq}

*${needHelpTitle}*
👤 *${ownerLabel}* ${ownerUsername}

*${responseTimeLabel}* ${responseTime}`;
  }

  // Format error messages consistently
  static formatErrorMessage(title: string, message: string, suggestion?: string): string {
    const escapedTitle = this.escapeMarkdownV2(title);
    const escapedMessage = this.escapeMarkdownV2(message);

    let result = `❌ *${escapedTitle}*

${escapedMessage}`;

    if (suggestion) {
      const escapedSuggestion = this.escapeMarkdownV2(suggestion);
      result += `\n\n💡 *Suggestion:* ${escapedSuggestion}`;
    }

    return result;
  }

  // Format search prompt message
  static formatSearchPrompt(): string {
    const title = this.escapeMarkdownV2('Search for Channels');
    const instruction = this.escapeMarkdownV2('Type what you\'re looking for...');
    const examples = this.escapeMarkdownV2('Examples: "anime", "sword", "crafting", "tutorials"');

    return `🔍 *${title}*

${instruction}

💡 *${examples}*

You can also use the /search command followed by your query.`;
  }

  // Format loading message
  static formatLoadingMessage(action: string): string {
    const escapedAction = this.escapeMarkdownV2(action);
    return `⏳ *${escapedAction}*

Please wait...`;
  }

  // Format success message
  static formatSuccessMessage(message: string): string {
    const escapedMessage = this.escapeMarkdownV2(message);
    return `✅ *Success*

${escapedMessage}`;
  }

  // Helper method to format large numbers
  private static formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Helper method to format relative time
  static formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Sanitize user input for search
  static sanitizeSearchQuery(query: string): string {
    return query
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .substring(0, 100); // Limit to 100 characters
  }
}