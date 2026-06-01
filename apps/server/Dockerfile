# Stage 1: Prune monorepo to only what server needs
FROM oven/bun:1.2-alpine AS pruner
WORKDIR /app
RUN bun add -g turbo
COPY . .
RUN turbo prune server --docker

# Stage 2: Install deps from the pruned lockfile
FROM oven/bun:1.2-alpine AS installer
WORKDIR /app
# Copy pruned package manifests (no source yet — maximises layer cache)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile

# Stage 3: Build (generate Prisma client)
FROM installer AS builder
COPY --from=pruner /app/out/full/ .
RUN cd packages/db && bunx prisma generate

# Stage 4: Lean runtime image
FROM oven/bun:1.2-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app .

EXPOSE 3001
CMD ["bun", "apps/server/src/index.ts"]
