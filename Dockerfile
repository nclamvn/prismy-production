# Multi-stage Docker build for Next.js 15 App Router production deployment
# Optimized for performance, security, and minimal image size

# ===============================================
# Stage 1: Dependencies Installation
# ===============================================
FROM node:24-alpine AS deps
LABEL stage=deps

# Install system dependencies for native modules
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with production optimizations
RUN npm ci --only=production --no-audit --no-fund \
    && npm cache clean --force

# ===============================================
# Stage 2: Build Stage
# ===============================================
FROM node:24-alpine AS builder
LABEL stage=builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install dev dependencies needed for build
RUN npm ci --include=dev --no-audit --no-fund

# Generate Prisma client (if using Prisma)
# RUN npx prisma generate

# Build the application with optimizations
RUN npm run build

# ===============================================
# Stage 3: Production Runtime
# ===============================================
FROM node:24-alpine AS runner
LABEL stage=runner

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create app user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Copy production files
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Health check script
COPY --chown=nextjs:nodejs <<'EOF' /app/healthcheck.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 10000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    console.error(`Health check failed with status: ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.error(`Health check failed: ${err.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Health check timed out');
  req.destroy();
  process.exit(1);
});

req.end();
EOF

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node /app/healthcheck.js

# Start the application
CMD ["node", "server.js"]

# ===============================================
# Build Arguments and Labels for Metadata
# ===============================================
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="Prismy Translation Platform" \
      org.label-schema.description="Enterprise translation platform with AI-powered workflows" \
      org.label-schema.url="https://prismy.com" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url="https://github.com/prismy/prismy-production" \
      org.label-schema.vendor="Prismy Inc." \
      org.label-schema.version=$VERSION \
      org.label-schema.schema-version="1.0"