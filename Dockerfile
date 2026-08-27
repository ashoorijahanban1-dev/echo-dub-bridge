# Multi-stage Dockerfile for EchoDub Web (Next.js 16 LTS)
FROM node:20-slim AS builder
WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Copy source code and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Production Runner
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl curl ca-certificates tar xz-utils wget && \
    wget -qO /tmp/7z.tar.xz https://www.7-zip.org/a/7z2408-linux-x64.tar.xz && \
    tar -xf /tmp/7z.tar.xz -C /usr/local/bin 7zz && \
    chmod +x /usr/local/bin/7zz && \
    ln -sf /usr/local/bin/7zz /usr/local/bin/7z && \
    rm -f /tmp/7z.tar.xz && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Run prisma db push and seed on startup if needed, then start Next.js
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && npm run start"]
