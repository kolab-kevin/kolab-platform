# syntax=docker/dockerfile:1
# Optimized Next.js service image

ARG NODE_VERSION=20-alpine
ARG APP_FILTER=@kolab/web
ARG APP_DIR=web
ARG APP_PORT=3000
ARG IMAGE_TITLE=KOLAB Web

FROM node:${NODE_VERSION} AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS pruner
ARG APP_FILTER
COPY . .
RUN pnpm dlx turbo@2.10.0 prune ${APP_FILTER} --docker

FROM base AS deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS builder
ARG APP_FILTER
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY --from=pruner /app/out/full/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo build --filter=${APP_FILTER}...

FROM node:${NODE_VERSION} AS runner
ARG APP_DIR
ARG APP_PORT
ARG IMAGE_TITLE

LABEL org.opencontainers.image.title="${IMAGE_TITLE}" \
      org.opencontainers.image.vendor="KOLAB Platform"

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=${APP_PORT}
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 kolab && adduser --system --uid 1001 kolab
USER kolab

COPY --from=builder --chown=kolab:kolab /app/apps/${APP_DIR}/.next/standalone ./
COPY --from=builder --chown=kolab:kolab /app/apps/${APP_DIR}/.next/static ./apps/${APP_DIR}/.next/static

EXPOSE ${APP_PORT}
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${APP_PORT}/ || exit 1

CMD ["sh", "-c", "node apps/${APP_DIR}/server.js"]
