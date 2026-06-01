# Mone

A full-stack centralized cryptocurrency exchange (CEX) built as a monorepo.

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Backend | Hono v4 |
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Database | PostgreSQL 15 + PgBouncer (session mode) |
| ORM | Prisma v7 |
| Cache / Sessions | Redis v5 |
| Matching Engine v1 | TypeScript (in-process) |
| Matching Engine v2 | Go 1.22, per-market goroutines |
| Message Broker | Redpanda (Kafka-compatible) |
| WebSockets | Bun native + Redis pub/sub |
| Blockchain | Solana Web3.js, SPL Token |
| Wallet Adapters | Phantom, Solflare |
| Charts | lightweight-charts v5 |
| Monorepo | Turborepo |
| Infra | Docker Compose, Kubernetes, Nginx |
| Monitoring | Prometheus, Grafana |

---

## Monorepo Structure

```
mone/
├── apps/
│   ├── server/                 # Hono API server (Bun)
│   │   ├── src/
│   │   │   ├── engine/
│   │   │   │   └── v1/         # TypeScript matching engine
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   │   ├── solana/     # Deposit monitor, withdrawal queue, SPL
│   │   │   │   └── execution/  # Settlement, slippage
│   │   │   ├── repo/
│   │   │   ├── routes/
│   │   │   ├── ws/             # WebSocket handler + registry
│   │   │   ├── eventbroker/    # Kafka producer + settlement worker
│   │   │   ├── middlewares/
│   │   │   └── metrics.ts      # Prometheus metrics
│   │   └── engine/             # Go matching engine microservice
│   │       ├── v2/             # Go engine package (per-market goroutines)
│   │       ├── main.go
│   │       ├── go.mod
│   │       └── Dockerfile
│   └── client/                 # Next.js frontend
│       └── src/
│           ├── app/            # App Router pages
│           ├── components/     # OrderBook, OrderForm, PriceChart, etc.
│           ├── context/        # AuthContext
│           ├── hooks/          # useWebSocket
│           └── lib/            # API client
├── packages/
│   ├── db/                     # Prisma schema + client singleton
│   ├── config/                 # Shared env validation (Zod)
│   ├── types/                  # Shared Zod schemas
│   ├── pubsub/                 # Redis pub/sub client
│   └── eventbroker/            # Shared KafkaJS client + Topics
├── nginx/
│   └── nginx.conf              # Reverse proxy, rate limiting, WS upgrade
├── k8s/                        # Kubernetes manifests + prometheus config
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.2
- [Docker](https://docker.com) + Docker Compose
- [Go](https://go.dev) >= 1.22 (only for local Go engine dev)

### Install

```bash
bun install
```

### Environment

Copy and fill in the env files:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.local.example apps/client/.env.local
```

Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Access token secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `SOLANA_MASTER_SECRET` | Seed for deterministic keypair derivation |
| `SOLANA_RPC_URL` | Solana RPC endpoint |
| `USDC_MINT` | USDC mint address |
| `KAFKA_BROKER` | Kafka/Redpanda broker address |
| `USE_KAFKA` | `true` to route orders through Go engine |
| `FRONTEND_URL` | CORS allowed origin |
| `NEXT_PUBLIC_API_URL` | Backend URL (client-side) |

### Run with Docker Compose

```bash
# Start all services
docker compose up

# Start only infrastructure (db, redis, redpanda)
docker compose up postgres redis redpanda

# Start with Go engine + Kafka
USE_KAFKA=true docker compose up
```

Services:

| Service | Port | Description |
|---------|------|-------------|
| Nginx | 80 / 443 | Reverse proxy (entry point) |
| Server | 3001 | Hono API |
| Client | 3000 | Next.js frontend |
| Engine | — | Go matching engine |
| PostgreSQL | 5432 | Database |
| PgBouncer | 6432 | Connection pool |
| Redis | 6379 | Cache + pub/sub |
| Redpanda | 9092 | Kafka-compatible broker |
| Prometheus | 9090 | Metrics scraper |
| Grafana | 3100 | Dashboards (admin / admin) |

### Run locally (dev)

```bash
# Start infrastructure
docker compose up postgres redis -d

# Run migrations
cd packages/db && bunx prisma migrate dev

# Start server
cd apps/server && bun dev

# Start client
cd apps/client && bun dev
```

### Tests

```bash
# Unit tests (no Docker needed)
cd apps/server && bun test

# E2E tests (requires Docker with Postgres + Redis running)
cd apps/server && bun test --testPathPattern=e2e
```

---

## Architecture

### Request Flow

```
Client → Nginx → Server (Hono)
                    ├── in-process TS engine v1  (default)
                    └── Kafka → Go engine v2     (USE_KAFKA=true)
                                    └── Kafka → Settlement Worker → DB + WebSocket
```

### WebSocket Channels

Clients subscribe via `{ action: "subscribe", channel: "<name>" }`:

| Channel | Data |
|---------|------|
| `orderbook:<marketId>` | Top 10 bids/asks with depth |
| `trades:<marketId>` | Recent trades |
| `ticker:<marketId>` | Best bid, best ask, last price, 24h volume |

### Matching Engine

**v1 (TypeScript)** — `apps/server/src/engine/v1/`
- In-process, zero latency overhead
- Price-time priority, atomic settlement via Prisma transactions
- Slippage checks, MARKET order no-liquidity rollback

**v2 (Go)** — `apps/server/engine/v2/`
- Separate microservice, communicates via Kafka topics
- Per-market goroutines: each market has a dedicated channel + goroutine owning its own `OrderBook`
- Zero lock contention between markets under concurrent load

### Withdrawal Safety

- All withdrawals are **async** — balance is deducted immediately, on-chain send is queued
- Queue polls every 30s, max 5 retries with exponential backoff (up to 1h)
- On permanent failure: internal balance is automatically refunded
- Daily limits: 10 SOL, 5000 USDC/USDT per user

### Solana Integration

- Deterministic deposit address per user: `HMAC-SHA256(masterSecret, "mone:deposit:" + userId)` → keypair seed
- SOL deposits: poll RPC balance diff every 10s
- SPL deposits: parse `transferChecked` instructions on user ATAs
- Withdrawals: send directly from user's derived deposit address

---

## Deploy (Kubernetes)

```bash
# Fill in k8s/secrets.yaml with base64-encoded values, then:
kubectl apply -k k8s/
```

Kubernetes manifests in `k8s/`:

| File | What |
|------|------|
| `namespace.yaml` | `mone` namespace |
| `secrets.yaml` | Secret template (do not commit real values) |
| `postgres.yaml` | StatefulSet + PVC |
| `redis.yaml` | Deployment + PVC |
| `redpanda.yaml` | StatefulSet |
| `server.yaml` | Deployment (2 replicas) + HPA (2–10, 70% CPU) |
| `client.yaml` | Deployment (2 replicas) |
| `engine.yaml` | Go engine Deployment |
| `nginx.yaml` | Deployment + LoadBalancer + Ingress |
| `monitoring.yaml` | Prometheus (with RBAC pod discovery) + Grafana |

For TLS, install [cert-manager](https://cert-manager.io) and uncomment the annotations in `k8s/nginx.yaml`.

---

## Monitoring

- **Metrics endpoint**: `GET /metrics` (Prometheus text format)
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3100` — default login `admin / admin`

Prometheus auto-discovers server pods via annotations:

```yaml
prometheus.io/scrape: "true"
prometheus.io/port: "3001"
prometheus.io/path: "/metrics"
```
