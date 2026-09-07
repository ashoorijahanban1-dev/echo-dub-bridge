# Multi-stage Dockerfile for EchoDub Web (Next.js 16 LTS)
FROM node:20-slim AS builder
WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --include=dev

# Copy source code and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Production Runner
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y openssl curl p7zip-full && \
    rm -rf /var/lib/apt/lists/*

# Install official standalone unrar binary for RAR5 extraction
RUN (curl -sL https://www.rarlab.com/rar/rarlinux-x64-624.tar.gz -o /tmp/rarlinux.tar.gz && \
    tar -xzf /tmp/rarlinux.tar.gz -C /usr/local/bin --strip-components=1 rar/unrar && \
    chmod +x /usr/local/bin/unrar && \
    rm -f /tmp/rarlinux.tar.gz) || true

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV ADMIN_PASSWORD=admin123456
ENV ADMIN_SESSION_SECRET=echodub_admin_session_secret_super_secure_key_2026

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
RUN mkdir -p /app/storage/courses /app/storage/downloads /app/storage/extracted /app/prisma

EXPOSE 3000

# Ensure storage and prisma volumes have full write permissions at runtime, then start
CMD ["sh", "-c", "mkdir -p /app/storage/courses /app/storage/downloads /app/storage/extracted /app/prisma && chmod -R 777 /app/storage /app/prisma 2>/dev/null || true; npx prisma db push && npm run start"]
