# syntax=docker/dockerfile:1

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ─── Dependencies ─────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
RUN pnpm install --frozen-lockfile

# ─── Build ────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL=postgresql://kolab:kolab@postgres:5432/kolab
RUN pnpm turbo build --filter=@kolab/api...

# ─── Production ───────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 kolab && adduser --system --uid 1001 kolab
USER kolab
WORKDIR /app

COPY --from=builder --chown=kolab:kolab /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=kolab:kolab /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=kolab:kolab /app/node_modules ./node_modules
COPY --from=builder --chown=kolab:kolab /app/packages ./packages

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
