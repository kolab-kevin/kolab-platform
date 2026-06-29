# Deployment

KŌLAB Platform is **Docker-first**. Every application has its own Dockerfile and can be deployed independently.

## Quick start

```bash
cp .env.example .env
docker compose up -d --build
```

## Services

After startup:

| URL                     | Service        |
| ----------------------- | -------------- |
| <http://localhost:3000> | Web            |
| <http://localhost:3001> | Admin          |
| <http://localhost:3002> | Creator Portal |
| <http://localhost:3003> | Moderator      |
| <http://localhost:4000> | API            |
| <http://localhost:4001> | Public API     |
| <http://localhost:4002> | Mobile API     |
| <http://localhost:4003> | AI Services    |

## Independent deployment

Build and push a single service:

```bash
docker build -f docker/api.Dockerfile -t kolab/api:latest .
docker build -f docker/web.Dockerfile -t kolab/web:latest .
```

## Migration job

The `migrate` service runs `prisma migrate deploy` once before backend services start.

## Production notes

- Set strong `JWT_SECRET` (32+ characters)
- Use managed PostgreSQL and Redis
- Deploy each service to its own container orchestration unit (ECS, Cloud Run, K8s, etc.)
