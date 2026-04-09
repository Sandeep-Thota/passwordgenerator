FROM node:20-slim AS base
WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --production=false

# Copy shared engine code
COPY src/engine/ ./src/engine/

# Copy server code
COPY server/ ./server/

# Build
WORKDIR /app/server

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["npx", "ts-node", "index.ts"]
