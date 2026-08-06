# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN npm install -g bun

# ── deps ───────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
RUN bun add -g turbo
COPY . .
RUN turbo prune client --docker

FROM base AS installer
WORKDIR /app
COPY --from=deps /app/out/json/ .
COPY --from=deps /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile

# ── build ──────────────────────────────────────────────
FROM installer AS builder
COPY --from=deps /app/out/full/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/client && bun run build

# ── runtime (standalone) ──────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/apps/client/next.config.ts ./apps/client/next.config.ts
COPY --from=builder /app/apps/client/public ./apps/client/public
COPY --from=builder /app/apps/client/.next/standalone ./
COPY --from=builder /app/apps/client/.next/static ./apps/client/.next/static

EXPOSE 3000
CMD ["bun", "apps/client/server.js"]
