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

echo "🐳 Starting Docker containers..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "📦 Installing dependencies..."
docker compose exec web npm install

echo ""
echo "🗄️  Generating Prisma client..."
docker compose exec web npm run db:generate

echo ""
echo "🔄 Pushing database schema..."
docker compose exec web npm run db:push

echo ""
echo "🌱 Seeding database..."
docker compose exec web npm run db:seed

echo ""
echo "🔄 Syncing catalog from Fortnite API..."
docker compose exec web npm run sync:catalog

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
