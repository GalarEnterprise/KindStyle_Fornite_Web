import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const MOCK_PRODUCTS = [
  { fortniteProductId: 'CID_MOCK_001', name: 'Spider-Man', type: 'OUTFIT', rarity: 'EPIC', priceVbucks: 1500 },
  { fortniteProductId: 'CID_MOCK_002', name: 'Batman', type: 'OUTFIT', rarity: 'LEGENDARY', priceVbucks: 2000 },
  { fortniteProductId: 'CID_MOCK_003', name: 'Renegade Raider', type: 'OUTFIT', rarity: 'RARE', priceVbucks: 1200 },
  { fortniteProductId: 'CID_MOCK_004', name: 'Aura', type: 'OUTFIT', rarity: 'UNCOMMON', priceVbucks: 800 },
  { fortniteProductId: 'CID_MOCK_005', name: 'Skull Trooper', type: 'OUTFIT', rarity: 'EPIC', priceVbucks: 1500 },
  { fortniteProductId: 'BID_MOCK_001', name: 'Shield Breaker', type: 'BACK_BLING', rarity: 'RARE', priceVbucks: 500 },
  { fortniteProductId: 'BID_MOCK_002', name: 'Dark Void', type: 'BACK_BLING', rarity: 'EPIC', priceVbucks: 800 },
  { fortniteProductId: 'BID_MOCK_003', name: 'Bat Attitude', type: 'BACK_BLING', rarity: 'LEGENDARY', priceVbucks: 600 },
  { fortniteProductId: 'Pickaxe_MOCK_001', name: 'AC/DC', type: 'PICKAXE', rarity: 'RARE', priceVbucks: 800 },
  { fortniteProductId: 'Pickaxe_MOCK_002', name: 'Star Wand', type: 'PICKAXE', rarity: 'EPIC', priceVbucks: 1200 },
  { fortniteProductId: 'Pickaxe_MOCK_003', name: 'Reaper', type: 'PICKAXE', rarity: 'LEGENDARY', priceVbucks: 1500 },
  { fortniteProductId: 'Glider_MOCK_001', name: 'Mako', type: 'GLIDER', rarity: 'RARE', priceVbucks: 800 },
  { fortniteProductId: 'Glider_MOCK_002', name: 'Raptor', type: 'GLIDER', rarity: 'LEGENDARY', priceVbucks: 1200 },
  { fortniteProductId: 'EID_MOCK_001', name: 'Floss', type: 'EMOTE', rarity: 'RARE', priceVbucks: 500 },
  { fortniteProductId: 'EID_MOCK_002', name: 'Orange Justice', type: 'EMOTE', rarity: 'RARE', priceVbucks: 500 },
  { fortniteProductId: 'EID_MOCK_003', name: 'Take the L', type: 'EMOTE', rarity: 'EPIC', priceVbucks: 800 },
  { fortniteProductId: 'EID_MOCK_004', name: 'Fresh', type: 'EMOTE', rarity: 'RARE', priceVbucks: 500 },
  { fortniteProductId: 'Wrap_MOCK_001', name: 'Cuddle Team', type: 'WRAP', rarity: 'RARE', priceVbucks: 500 },
  { fortniteProductId: 'Wrap_MOCK_002', name: 'Dragon', type: 'WRAP', rarity: 'EPIC', priceVbucks: 700 },
  { fortniteProductId: 'Wrap_MOCK_003', name: 'Carbon & Gold', type: 'WRAP', rarity: 'LEGENDARY', priceVbucks: 800 },
  { fortniteProductId: 'MusicPack_MOCK_001', name: 'OG (Classic)', type: 'MUSIC_PACK', rarity: 'RARE', priceVbucks: 200 },
  { fortniteProductId: 'Contrail_MOCK_001', name: 'Disco', type: 'CONTRAIL', rarity: 'UNCOMMON', priceVbucks: 300 },
  { fortniteProductId: 'Spray_MOCK_001', name: 'Sad Tomato', type: 'SPRAY', rarity: 'UNCOMMON', priceVbucks: 150 },
  { fortniteProductId: 'LS_MOCK_001', name: 'Season 5', type: 'LOADING_SCREEN', rarity: 'UNCOMMON', priceVbucks: 200 },
]

function normalizeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

async function main() {
  console.log('[Seed] Starting database seed...')

  // Create Super Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@kindstyle.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456'

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    await prisma.user.create({
      data: {
        email: adminEmail,
        password_hash: passwordHash,
        nickname: 'SuperAdmin',
        role: 'SUPER_ADMIN',
        verification_status: 'VERIFIED',
      },
    })
    console.log(`[Seed] Super Admin created: ${adminEmail}`)
  } else {
    console.log(`[Seed] Super Admin already exists: ${adminEmail}`)
  }

  // Create demo users for client testing
  const demoUsers = [
    { email: 'demo@kindstyle.com', nickname: 'DemoUser', password: 'demo123456', role: 'USER' as const },
    { email: 'cliente@kindstyle.com', nickname: 'ClienteTest', password: 'cliente123', role: 'USER' as const },
  ]

  for (const demo of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email: demo.email } })
    if (!existing) {
      const hash = await bcrypt.hash(demo.password, 12)
      await prisma.user.create({
        data: {
          email: demo.email,
          password_hash: hash,
          nickname: demo.nickname,
          role: demo.role,
          verification_status: 'VERIFIED',
        },
      })
      console.log(`[Seed] Demo user created: ${demo.email} / ${demo.password}`)
    } else {
      console.log(`[Seed] Demo user already exists: ${demo.email}`)
    }
  }

  await prisma.currencySetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      default_currency: 'MXN',
      vbucks_rate_mxn: 7.5,
    },
  })
  console.log('[Seed] CurrencySetting created')

  const now = new Date()

  for (let i = 0; i < MOCK_PRODUCTS.length; i++) {
    const mock = MOCK_PRODUCTS[i]
    const sku = `FORT-${String(i + 1).padStart(6, '0')}`
    const slug = normalizeSlug(mock.name)

    await prisma.product.upsert({
      where: { slug: `${slug}-${i}` },
      update: {},
      create: {
        internal_sku: sku,
        fortnite_product_id: mock.fortniteProductId,
        name: mock.name,
        slug: `${slug}-${i}`,
        type: mock.type as any,
        rarity: mock.rarity as any,
        price_vbucks: mock.priceVbucks,
        giftable: 'GIFTABLE',
        active: true,
        visible: true,
        first_seen_at: now,
        last_seen_at: now,
      },
    })
  }
  console.log(`[Seed] ${MOCK_PRODUCTS.length} products created`)

  const allProducts = await prisma.product.findMany({
    take: MOCK_PRODUCTS.length,
    orderBy: { created_at: 'asc' },
  })

  const rawPayload = {
    hash: 'mock-seed-hash',
    date: now.toISOString(),
    entries: MOCK_PRODUCTS.map((p) => ({
      regularPrice: p.priceVbucks,
      finalPrice: p.priceVbucks,
      items: [{ id: p.fortniteProductId, name: p.name }],
    })),
  }

  const checksum = createHash('sha256')
    .update(JSON.stringify(rawPayload))
    .digest('hex')

  const snapshot = await prisma.shopSnapshot.create({
    data: {
      provider: 'seed-mock',
      fetched_at: now,
      shop_date: now,
      raw_payload: rawPayload as any,
      checksum,
    },
  })

  for (let i = 0; i < allProducts.length; i++) {
    await prisma.shopItem.create({
      data: {
        shop_snapshot_id: snapshot.id,
        product_id: allProducts[i].id,
        price_vbucks: MOCK_PRODUCTS[i].priceVbucks,
        display_order: i,
        section: i < 5 ? 'Featured' : null,
        featured: i < 5,
      },
    })
  }
  console.log('[Seed] Snapshot created with shop items')

  console.log('[Seed] Done!')
}

main()
  .catch((e) => {
    console.error('[Seed] Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
