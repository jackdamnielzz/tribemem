FROM node:20-alpine AS base
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @tribemem/shared build
RUN pnpm --filter @tribemem/worker build
RUN pnpm --filter @tribemem/worker deploy --prod /app/deployed

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/deployed ./
COPY --from=builder /app/apps/worker/dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
