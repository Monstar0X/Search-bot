#!/usr/bin/env node

/**
 * Swordsmith Channel Search Bot Setup Script
 *
 * This script helps with initial bot setup and configuration.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('🎌 Swordsmith Channel Search Bot Setup');
  console.log('=====================================\n');

  // Check if .env already exists
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ Setup cancelled.');
      rl.close();
      return;
    }
  }

  // Get required configuration
  console.log('📝 Please provide the following configuration:\n');

  const botToken = await question('🤖 Enter your Telegram Bot Token (from @BotFather): ');
  if (!botToken) {
    console.log('❌ Bot token is required.');
    rl.close();
    return;
  }

  const ownerId = await question('👤 Enter your Telegram User ID: ');
  if (!ownerId || isNaN(ownerId)) {
    console.log('❌ Valid user ID is required.');
    rl.close();
    return;
  }

  // Get optional configuration
  console.log('\n📋 Optional configuration (press Enter for defaults):\n');

  const maxResults = await question('🔢 Max search results (5): ') || '5';
  const syncInterval = await question('🔄 Sync interval in hours (24): ') || '24';
  const searchHistory = await question('📊 Enable search history (Y/n): ') || 'y';
  const logLevel = await question('📝 Log level - info, warn, error, debug (info): ') || 'info';

  // Create .env file
  const envContent = `# Bot Configuration
BOT_TOKEN=${botToken}
OWNER_TELEGRAM_ID=${ownerId}

# Database
DATABASE_PATH=./data/channels.db

# Sync Configuration
SYNC_INTERVAL_HOURS=${syncInterval}
QUICK_SYNC_INTERVAL_HOURS=6

# Bot Settings
MAX_SEARCH_RESULTS=${maxResults}
SEARCH_HISTORY_ENABLED=${searchHistory.toLowerCase() === 'y'}

# Logging
LOG_LEVEL=${logLevel}
LOG_DIR=./logs

# Optional: Customization
BOT_NAME=Swordsmith Channel Search
WELCOME_MESSAGE_CUSTOM=true
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Environment configuration saved to .env');

    // Create required directories
    const dataDir = path.join(__dirname, '../data');
    const logsDir = path.join(__dirname, '../logs');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ Created data directory');
    }

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log('✅ Created logs directory');
    }

    // Add .gitignore entries if not present
    const gitignorePath = path.join(__dirname, '../.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignoreContent.includes('.env')) {
        fs.appendFileSync(gitignorePath, '\n# Environment variables\n.env\n');
        console.log('✅ Added .env to .gitignore');
      }
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Review the .env file if needed');
    console.log('2. Install dependencies: npm install');
    console.log('3. Build the project: npm run build');
    console.log('4. Start the bot: npm start');
    console.log('\n💡 For development, use: npm run dev');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }

  rl.close();
}

// Run setup
if (require.main === module) {
  setup().catch(console.error);
}

module.exports = { setup };