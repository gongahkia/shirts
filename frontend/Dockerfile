# Frontend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
ENV VITE_API_URL=http://localhost:3001/api
ENV VITE_SOCKET_URL=http://localhost:3001
RUN npm run build

# Production image, serve with nginx
FROM nginx:alpine AS runner

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S shirtsui -u 1001

# Change ownership of nginx directories
RUN chown -R shirtsui:nodejs /var/cache/nginx && \
    chown -R shirtsui:nodejs /var/log/nginx && \
    chown -R shirtsui:nodejs /etc/nginx/conf.d

# Switch to non-root user
USER shirtsui

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]