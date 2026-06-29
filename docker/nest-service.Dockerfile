# syntax=docker/dockerfile:1
# Optimized NestJS service image — set APP_FILTER, APP_DIR, APP_PORT, IMAGE_TITLE build args

ARG NODE_VERSION=20-alpine
ARG APP_FILTER=@kolab/api
ARG APP_DIR=api
ARG APP_PORT=4000
ARG IMAGE_TITLE=KOLAB API
ARG IMAGE_DESCRIPTION=KOLAB Platform NestJS service

FROM node:${NODE_VERSION} AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ─── Prune monorepo to service scope ───────────────────────────────
FROM base AS pruner
ARG APP_FILTER
COPY . .
RUN pnpm dlx turbo@2.10.0 prune ${APP_FILTER} --docker

# ─── Install dependencies (BuildKit cache) ─────────────────────────
FROM base AS deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ─── Build ───────────────────────────────────────────────────────────
FROM base AS builder
ARG APP_FILTER
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY --from=pruner /app/out/full/ .
ENV DATABASE_URL=postgresql://kolab:kolab@postgres:5432/kolab
RUN pnpm turbo build --filter=${APP_FILTER}...

# ─── Production runner (minimal) ─────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
ARG APP_DIR
ARG APP_PORT
ARG IMAGE_TITLE
ARG IMAGE_DESCRIPTION

LABEL org.opencontainers.image.title="${IMAGE_TITLE}" \
      org.opencontainers.image.description="${IMAGE_DESCRIPTION}" \
      org.opencontainers.image.vendor="KOLAB Platform" \
      org.opencontainers.image.source="https://github.com/kolab-kevin/kolab-platform"

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 kolab && adduser --system --uid 1001 kolab
USER kolab
WORKDIR /app

COPY --from=builder --chown=kolab:kolab /app/apps/${APP_DIR}/dist ./apps/${APP_DIR}/dist
COPY --from=builder --chown=kolab:kolab /app/apps/${APP_DIR}/package.json ./apps/${APP_DIR}/package.json
COPY --from=builder --chown=kolab:kolab /app/node_modules ./node_modules
COPY --from=builder --chown=kolab:kolab /app/packages ./packages

EXPOSE ${APP_PORT}
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${APP_PORT}/health || exit 1

WORKDIR /app/apps/${APP_DIR}
CMD ["node", "dist/main.js"]
