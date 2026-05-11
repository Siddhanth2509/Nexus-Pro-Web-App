FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend source code
COPY backend/src ./src

# Create directory for database (if using SQLite)
RUN mkdir -p /app/data

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7860/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port (HF Spaces uses 7860)
EXPOSE 7860

# Set environment
ENV PORT=7860
ENV NODE_ENV=production

# Start the server
CMD ["node", "src/index.js"]
