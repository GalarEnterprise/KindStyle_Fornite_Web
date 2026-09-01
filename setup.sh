#!/bin/bash

# ============================================
# KindStyle Fortnite Store - Setup Script
# ============================================

set -e

echo "🎮 KindStyle Fortnite Store - Setup"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env created"
    echo ""
    echo "⚠️  Please edit .env with your actual values:"
    echo "   - FORTNITE_API_KEY"
    echo "   - JWT_SECRET"
    echo "   - JWT_REFRESH_SECRET"
    echo "   - ENCRYPTION_KEY"
    echo "   - RESEND_API_KEY (optional)"
    echo ""
    read -p "Press Enter after editing .env..."
fi

echo "🐳 Starting PostgreSQL and Redis..."
docker compose up -d postgres redis

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

for i in {1..30}; do
    if docker compose exec postgres pg_isready -U kindstyle > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    echo "   Waiting... ($i/30)"
    sleep 2
done

echo ""
echo "🏗️  Building builder image (with Prisma, tsx, etc)..."
docker compose build migrate

echo ""
echo "🗄️  Running database migrations..."
docker compose run --rm migrate sh -c "\
  ./node_modules/.bin/prisma db push --schema=packages/database/prisma/schema.prisma --accept-data-loss && \
  echo '✅ Migrations done' && \
  echo '🌱 Seeding database...' && \
  ./node_modules/.bin/tsx packages/database/prisma/seed.ts && \
  echo '✅ Seed done' && \
  echo '🔄 Syncing catalog from Fortnite API...' && \
  ./node_modules/.bin/tsx scripts/sync-catalog.ts && \
  echo '✅ Catalog synced'"

echo ""
echo "🐳 Starting web and worker..."
docker compose up -d web worker

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Services running:"
echo "   - Web App:    http://localhost:3000"
echo "   - PostgreSQL: localhost:5434"
echo "   - Redis:      localhost:6380"
echo ""
echo "📊 Useful commands:"
echo "   - View logs:    docker compose logs -f"
echo "   - Stop:         docker compose down"
echo "   - Restart:      docker compose restart"
echo "   - Rebuild:      docker compose up -d --build"
echo ""
