import express from 'express';
import dotenv from 'dotenv';
import { SwordsmithBot } from './bot';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Swordsmith Channel Search Bot',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Start the bot
let bot: SwordsmithBot;

async function startBot() {
  try {
    console.log('Starting Swordsmith Bot...');
    bot = new SwordsmithBot();
    await bot.initialize();
    console.log('✅ Bot started successfully!');
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  startBot();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (bot) {
    // Bot will handle its own cleanup
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  if (bot) {
    // Bot will handle its own cleanup
  }
  process.exit(0);
});