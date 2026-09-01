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
echo "🏗️  Building all containers..."
docker compose build

echo ""
echo "🗄️  Running migrations, seed and catalog sync..."
docker compose run --rm --profile tools migrate

echo ""
echo "🐳 Starting web and worker..."
docker compose up -d web worker

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Services running:"
echo "   - Web App:    http://localhost:3000"
echo "   - PostgreSQL: localhost:5433"
echo "   - Redis:      localhost:6379"
echo ""
echo "📊 Useful commands:"
echo "   - View logs:    docker compose logs -f"
echo "   - Stop:         docker compose down"
echo "   - Restart:      docker compose restart"
echo "   - Rebuild:      docker compose up -d --build"
echo ""
