# Multi-stage Dockerfile for EpochForge
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code and build
COPY . .
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy built application from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/drizzle ./drizzle

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "server.js"]
