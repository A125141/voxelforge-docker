# ============== Stage 1: Build Frontend ==============
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ============== Stage 2: Build Backend ==============
FROM node:20-alpine AS backend-builder
WORKDIR /build/backend
RUN apk add --no-cache python3 make g++ \
    && cp /usr/bin/python3 /usr/bin/python
COPY backend/package*.json ./
RUN npm ci --production

# ============== Stage 3: Runtime ==============
FROM node:20-alpine AS runtime
WORKDIR /app

# Install runtime deps for better-sqlite3
RUN apk add --no-cache wget tini

# Copy backend node_modules
COPY --from=backend-builder /build/backend/node_modules ./node_modules

# Copy backend source
COPY backend/ ./

# Copy built frontend
COPY --from=frontend-builder /build/frontend/dist ./public

# Create data directory with correct permissions
RUN mkdir -p /app/data/worlds /app/data/db \
    && chown -R node:node /app

USER node

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_PATH=/app/data

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
