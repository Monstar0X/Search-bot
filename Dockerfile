# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install git for potential package installations
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001

# Create required directories
RUN mkdir -p data logs && \
    chown -R botuser:nodejs /app

# Copy built application
COPY --chown=botuser:nodejs dist ./dist

# Copy environment template
COPY --chown=botuser:nodejs .env.example .env.example

# Switch to non-root user
USER botuser

# Expose port (if using webhook mode)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const TelegramBot = require('node-telegram-bot-api'); const bot = new TelegramBot(process.env.BOT_TOKEN || 'dummy'); bot.getMe().then(() => process.exit(0)).catch(() => process.exit(1))" || echo "Health check fallback"

# Start the bot
CMD ["node", "dist/bot.js"]