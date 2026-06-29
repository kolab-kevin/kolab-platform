# Local Development Runbook

Step-by-step guide to running the KŌLAB Platform on your machine.

## Choose a mode

| Mode                 | Best for                           | Command                     |
| -------------------- | ---------------------------------- | --------------------------- |
| Hybrid (recommended) | Daily feature development          | pnpm + Docker infra only    |
| Docker-first         | Integration testing, prod-like env | Full `docker compose` stack |
| Single app           | Focused work on one service        | Turbo filter                |

## Prerequisites check

```bash
node --version    # ≥ 20
pnpm --version    # 9.15.0
docker --version  # Docker Desktop or Engine
docker compose version
```

Enable pnpm via Corepack if needed:

```bash
corepack enable
```

## Hybrid setup (recommended)

### 1. Clone and install

```bash
git clone <repo-url> kolab-platform
cd kolab-platform
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` for local services:

```env
DATABASE_URL=postgresql://kolab:kolab@localhost:5432/kolab
REDIS_URL=redis://localhost:6379
JWT_SECRET=local-dev-secret-minimum-32-characters-long
```

### 3. Start infrastructure

```bash
docker compose up postgres redis -d
```

Wait for health checks:

```bash
docker compose ps
```

Both `postgres` and `redis` should show `healthy`.

### 4. Initialize database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed          # optional: seed dev data
```

### 5. Start development servers

```bash
pnpm dev
```

Turbo starts all apps. Filter to specific services:

```bash
pnpm --filter @kolab/api dev
pnpm --filter @kolab/web dev
```

### 6. Verify

| Check         | URL / command                    |
| ------------- | -------------------------------- |
| API health    | <http://localhost:4000/health>   |
| API readiness | <http://localhost:4000/ready>    |
| Swagger docs  | <http://localhost:4000/api/docs> |
| Web app       | <http://localhost:3000>          |
| Admin         | <http://localhost:3001>          |

### 7. Validate changes

Before committing:

```bash
pnpm validate
```

## Docker-first setup

For a production-like environment with all services containerized:

```bash
cp .env.example .env
docker compose up -d --build
```

This builds and starts all 8 apps plus PostgreSQL, Redis, and the migration job.

Verify:

```bash
curl http://localhost:4000/health
docker compose logs -f api    # tail API logs
```

Stop:

```bash
docker compose down           # keep volumes
docker compose down -v        # destroy volumes (fresh DB)
```

## Single-app development

Run one app with its dependencies:

```bash
# API only (requires postgres + redis)
docker compose up postgres redis -d
pnpm db:generate
pnpm --filter @kolab/api dev

# Web only (requires API running)
pnpm --filter @kolab/web dev
```

## Database operations

| Task                    | Command                  |
| ----------------------- | ------------------------ |
| Generate Prisma client  | `pnpm db:generate`       |
| Apply migrations (dev)  | `pnpm db:migrate`        |
| Apply migrations (prod) | `pnpm db:migrate:deploy` |
| Open Prisma Studio      | `pnpm db:studio`         |
| Seed data               | `pnpm db:seed`           |

## Common issues

### Port already in use

```bash
# Find process on port 4000 (Windows PowerShell)
netstat -ano | findstr :4000

# Or change PORT in .env for the affected service
```

### Database connection refused

1. Confirm Docker containers are running: `docker compose ps`
2. Check `DATABASE_URL` points to `localhost:5432` (hybrid) or `postgres:5432` (Docker network)
3. Restart postgres: `docker compose restart postgres`

### Prisma client out of date

```bash
pnpm db:generate
```

Run after pulling schema changes or switching branches.

### Turbo cache issues

```bash
pnpm clean
pnpm build
```

See [Turbo remote cache](../engineering/turbo-remote-cache.md) for remote cache setup.

### Husky hooks not running

```bash
pnpm install    # re-runs prepare → husky
```

## Environment reference

| Variable              | Local (hybrid)           | Docker network          |
| --------------------- | ------------------------ | ----------------------- |
| `DATABASE_URL`        | `...@localhost:5432/...` | `...@postgres:5432/...` |
| `REDIS_URL`           | `redis://localhost:6379` | `redis://redis:6379`    |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000`  | `http://localhost:4000` |

Per-app overrides: `apps/<name>/.env.example`

## Shutdown

```bash
# Stop dev servers: Ctrl+C in the terminal running pnpm dev

# Stop Docker infra
docker compose down
```

## Related docs

- [Developer onboarding](../engineering/onboarding.md)
- [Coding standards](../engineering/coding-standards.md)
- [Architecture](../architecture/README.md)
- [Database](../database/README.md)
