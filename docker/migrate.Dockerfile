# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/typescript-config/package.json ./packages/typescript-config/
RUN pnpm install --frozen-lockfile

COPY packages/database ./packages/database

ENV DATABASE_URL=postgresql://kolab:kolab@postgres:5432/kolab
CMD ["pnpm", "--filter", "@kolab/database", "db:migrate:deploy"]
