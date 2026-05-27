# MedSlot Frontend Dockerfile
# Multi-stage build: deps → builder → runner (production standalone).
# Requires next.config.mjs to set output: 'standalone'.

# ── Stage 1: base ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# ── Stage 2: dependencies ──────────────────────────────────────────────────────
# Install only production + dev dependencies needed for the build.
# Separate stage so package.json changes don't bust the code copy cache.
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 3: builder ───────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# next build emits a standalone output bundle (server.js) when output: 'standalone'
# is set in next.config.mjs.
RUN npm run build

# ── Stage 4: runner ────────────────────────────────────────────────────────────
# Minimal production image: only the standalone bundle, public assets, and static files.
FROM base AS runner
ENV NODE_ENV=production

# Create a non-root user for security.
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only what is needed to run the server.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
