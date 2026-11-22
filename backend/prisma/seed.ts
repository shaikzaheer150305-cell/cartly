import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config()

const prisma = new PrismaClient()

type Palette = {
  bg1: string
  bg2: string
  accent: string
  accent2: string
}

const palettes: Record<string, Palette> = {
  default: { bg1: '#4338ca', bg2: '#0f172a', accent: '#818cf8', accent2: '#c7d2fe' },
  earbuds: { bg1: '#4f46e5', bg2: '#1e3a8a', accent: '#a5b4fc', accent2: '#e0e7ff' },
  watch: { bg1: '#0f766e', bg2: '#0f172a', accent: '#5eead4', accent2: '#99f6e4' },
  speaker: { bg1: '#7c3aed', bg2: '#312e81', accent: '#c4b5fd', accent2: '#ddd6fe' },
  cookware: { bg1: '#ea580c', bg2: '#7c2d12', accent: '#fdba74', accent2: '#fed7aa' },
  bottle: { bg1: '#0284c7', bg2: '#0c4a6e', accent: '#7dd3fc', accent2: '#bae6fd' },
  bedsheet: { bg1: '#be123c', bg2: '#4c0519', accent: '#fda4af', accent2: '#fecdd3' },
  book: { bg1: '#7c3aed', bg2: '#4a044e', accent: '#ddd6fe', accent2: '#f5d0fe' },
  yoga: { bg1: '#059669', bg2: '#064e3b', accent: '#6ee7b7', accent2: '#a7f3d0' },
  dumbbell: { bg1: '#334155', bg2: '#0f172a', accent: '#94a3b8', accent2: '#cbd5e1' },
  rope: { bg1: '#d97706', bg2: '#78350f', accent: '#fcd34d', accent2: '#fde68a' },
  wallet: { bg1: '#92400e', bg2: '#451a03', accent: '#d8b4fe', accent2: '#e9d5ff' },
  sunglasses: { bg1: '#0369a1', bg2: '#082f49', accent: '#67e8f9', accent2: '#a5f3fc' },
  backpack: { bg1: '#4d7c0f', bg2: '#1a2e05', accent: '#bef264', accent2: '#d9f99d' },
  shoe: { bg1: '#e11d48', bg2: '#881337', accent: '#fda4af', accent2: '#fecdd3' },
  shirt: { bg1: '#2563eb', bg2: '#1e3a8a', accent: '#93c5fd', accent2: '#bfdbfe' },
  kurta: { bg1: '#c026d3', bg2: '#701a75', accent: '#f0abfc', accent2: '#f5d0fe' },
}

const shapes: Record<string, (palette: Palette) => string> = {
  earbuds: (palette) => `
    <rect x="235" y="315" width="330" height="205" rx="72" fill="${palette.accent}"/>
    <rect x="265" y="345" width="270" height="125" rx="52" fill="#fff" opacity=".2"/>
    <circle cx="325" cy="305" r="58" fill="#fff"/>
    <rect x="309" y="285" width="32" height="120" rx="16" fill="#fff"/>
    <circle cx="475" cy="305" r="58" fill="#fff"/>
    <rect x="459" y="285" width="32" height="120" rx="16" fill="#fff"/>
    <path d="M350 435h100" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".65"/>`,
  watch: (palette) => `
    <rect x="345" y="185" width="110" height="115" rx="24" fill="${palette.accent2}"/>
    <rect x="345" y="500" width="110" height="115" rx="24" fill="${palette.accent2}"/>
    <rect x="285" y="275" width="230" height="250" rx="54" fill="#0f172a" stroke="${palette.accent}" stroke-width="18"/>
    <rect x="315" y="310" width="170" height="180" rx="32" fill="${palette.accent}"/>
    <path d="M400 340v65l45 30" stroke="#0f172a" stroke-width="14" stroke-linecap="round" fill="none"/>
    <circle cx="400" cy="405" r="12" fill="#0f172a"/>`,
  speaker: (palette) => `
    <rect x="235" y="280" width="330" height="240" rx="60" fill="${palette.accent}"/>
    <circle cx="400" cy="400" r="90" fill="#0f172a" opacity=".75"/>
    <circle cx="400" cy="400" r="58" fill="${palette.accent2}"/>
    <circle cx="400" cy="400" r="22" fill="#0f172a"/>
    <path d="M275 320h60M275 480h60M465 320h60M465 480h60" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".55"/>`,
  cookware: (palette) => `
    <ellipse cx="400" cy="375" rx="205" ry="105" fill="${palette.accent}"/>
    <ellipse cx="400" cy="360" rx="170" ry="80" fill="#0f172a" opacity=".7"/>
    <ellipse cx="400" cy="350" rx="140" ry="62" fill="${palette.accent2}"/>
    <rect x="585" y="350" width="160" height="42" rx="21" fill="#fff" opacity=".85"/>
    <path d="M255 430c70 85 220 85 290 0" stroke="#fff" stroke-width="14" fill="none" opacity=".5"/>`,
  bottle: (palette) => `
    <rect x="350" y="185" width="100" height="70" rx="18" fill="${palette.accent2}"/>
    <path d="M330 255h140c45 0 70 35 70 80v260c0 35-25 60-60 60H320c-35 0-60-25-60-60V335c0-45 25-80 70-80Z" fill="${palette.accent}"/>
    <rect x="320" y="360" width="160" height="110" rx="22" fill="#fff" opacity=".22"/>
    <path d="M350 520h100" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".6"/>`,
  bedsheet: (palette) => `
    <path d="M210 300h380l80 250H130Z" fill="${palette.accent}"/>
    <path d="M210 300h380l25 80H185Z" fill="#fff" opacity=".25"/>
    <path d="M160 500h480" stroke="#fff" stroke-width="12" opacity=".55"/>
    <path d="M285 320v230M400 320v230M515 320v230" stroke="#fff" stroke-width="8" opacity=".3"/>`,
  book: (palette) => `
    <rect x="245" y="220" width="310" height="360" rx="18" fill="${palette.accent}"/>
    <rect x="245" y="220" width="55" height="360" rx="18" fill="#0f172a" opacity=".45"/>
    <rect x="335" y="285" width="175" height="16" rx="8" fill="#fff" opacity=".85"/>
    <rect x="335" y="335" width="135" height="12" rx="6" fill="#fff" opacity=".55"/>
    <circle cx="450" cy="470" r="62" fill="${palette.accent2}" opacity=".85"/>
    <path d="m425 470 18 18 36-40" stroke="#0f172a" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  yoga: (palette) => `
    <rect x="215" y="315" width="370" height="145" rx="70" fill="${palette.accent}"/>
    <ellipse cx="585" cy="387" rx="70" ry="73" fill="${palette.accent2}"/>
    <ellipse cx="585" cy="387" rx="42" ry="44" fill="#0f172a" opacity=".6"/>
    <path d="M260 350h240M260 425h240" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".5"/>`,
  dumbbell: (palette) => `
    <rect x="265" y="365" width="270" height="70" rx="35" fill="${palette.accent}"/>
    <rect x="205" y="305" width="80" height="190" rx="26" fill="${palette.accent2}"/>
    <rect x="515" y="305" width="80" height="190" rx="26" fill="${palette.accent2}"/>
    <rect x="160" y="335" width="60" height="130" rx="20" fill="#fff" opacity=".7"/>
    <rect x="580" y="335" width="60" height="130" rx="20" fill="#fff" opacity=".7"/>`,
  rope: (palette) => `
    <path d="M310 265c-160 130-160 310 0 270M490 265c160 130 160 310 0 270" stroke="${palette.accent}" stroke-width="18" fill="none" stroke-linecap="round"/>
    <rect x="270" y="205" width="70" height="150" rx="35" fill="${palette.accent2}" transform="rotate(-12 305 280)"/>
    <rect x="460" y="205" width="70" height="150" rx="35" fill="${palette.accent2}" transform="rotate(12 495 280)"/>`,
  wallet: (palette) => `
    <rect x="215" y="295" width="370" height="235" rx="32" fill="${palette.accent}"/>
    <path d="M215 365h370v60H215Z" fill="#fff" opacity=".2"/>
    <rect x="250" y="445" width="160" height="52" rx="12" fill="${palette.accent2}"/>
    <circle cx="535" cy="390" r="26" fill="#0f172a" opacity=".65"/>
    <circle cx="535" cy="390" r="10" fill="#fff" opacity=".8"/>`,
  sunglasses: (palette) => `
    <path d="M180 320h440l-30 155c-8 40-45 65-105 65h-70c-60 0-97-25-105-65Z" fill="${palette.accent}" opacity=".92"/>
    <path d="M360 350h80" stroke="#fff" stroke-width="18" stroke-linecap="round"/>
    <path d="M180 330 95 285M620 330l85-45" stroke="#fff" stroke-width="16" stroke-linecap="round" opacity=".7"/>
    <path d="M240 370h95M465 370h95" stroke="#0f172a" stroke-width="12" stroke-linecap="round" opacity=".4"/>`,
  backpack: (palette) => `
    <path d="M310 245c0-50 30-80 90-80s90 30 90 80" stroke="${palette.accent2}" stroke-width="26" fill="none"/>
    <rect x="245" y="250" width="310" height="320" rx="70" fill="${palette.accent}"/>
    <path d="M245 420h310v90c0 35-25 60-60 60H305c-35 0-60-25-60-60Z" fill="${palette.accent2}"/>
    <rect x="340" y="430" width="120" height="90" rx="24" fill="#fff" opacity=".35"/>
    <path d="M280 310h240" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".5"/>`,
  shoe: (palette) => `
    <path d="M165 455c85-20 125-70 155-150h85c20 60 65 105 145 125 45 12 70 35 70 70H165Z" fill="${palette.accent}"/>
    <path d="M165 500h455v45H165Z" fill="#fff" opacity=".85"/>
    <path d="M345 330c25 45 60 80 110 105" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".7"/>
    <path d="M320 360h70M305 400h75" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".5"/>`,
  shirt: (palette) => `
    <path d="M310 230 245 270 185 370l85 45 40-65v260h170V350l40 65 85-45-60-100-65-40-45 35h-70Z" fill="${palette.accent}"/>
    <path d="M345 235c15 35 95 35 110 0" stroke="#fff" stroke-width="12" fill="none" opacity=".7"/>
    <path d="M310 500h180" stroke="#fff" stroke-width="10" opacity=".35"/>`,
  kurta: (palette) => `
    <path d="M345 210 250 265l-35 115 75 35 25-65v275h160V350l25 65 75-35-35-115-95-55-45 35Z" fill="${palette.accent}"/>
    <path d="M350 235c20 25 80 25 100 0" stroke="#fff" stroke-width="12" fill="none" opacity=".7"/>
    <path d="M400 300v275" stroke="#fff" stroke-width="8" opacity=".4"/>
    <path d="M305 350 250 520M495 350l55 170" stroke="${palette.accent2}" stroke-width="20" opacity=".8"/>`,
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function productImage(kind: string, label: string): string {
  const palette = palettes[kind] ?? palettes.default
  const shape = (shapes[kind] ?? shapes.default)(palette)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${palette.bg1}"/><stop offset="1" stop-color="${palette.bg2}"/></linearGradient><filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#020617" flood-opacity=".35"/></filter></defs><rect width="800" height="800" rx="48" fill="url(#bg)"/><circle cx="690" cy="110" r="180" fill="#fff" opacity=".08"/><circle cx="110" cy="690" r="220" fill="#fff" opacity=".07"/><g filter="url(#shadow)">${shape}</g><text x="400" y="705" text-anchor="middle" fill="#fff" font-size="34" font-family="Inter,Arial,sans-serif" font-weight="700">${escapeXml(label)}</text><text x="400" y="750" text-anchor="middle" fill="#fff" opacity=".7" font-size="18" letter-spacing="4" font-family="Inter,Arial,sans-serif">CARTLY</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const categoriesData = [
  { name: 'Electronics', slug: 'electronics', description: 'Audio, wearables and smart tech for everyday use.' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Thoughtful essentials for Indian homes and kitchens.' },
  { name: 'Books', slug: 'books', description: 'Stories, ideas and learning worth keeping.' },
  { name: 'Fitness', slug: 'fitness', description: 'Practical gear to help you move better every day.' },
  { name: 'Accessories', slug: 'accessories', description: 'Everyday carry essentials with a finishing touch.' },
  { name: 'Fashion', slug: 'fashion', description: 'Comfortable style for work, travel and weekends.' },
]

const legacySlugs = [
  'usb-c-hub',
  'ceramic-mug',
  'cast-iron-skillet',
  'design-patterns-handbook',
  'resistance-band-set',
  'canvas-tote-bag',
]

const productsData = [
  {
    name: 'boAt Airdopes 141',
    slug: 'wireless-headphones',
    description: 'Lightweight TWS earbuds with 42 hours of playback, low-latency gaming mode and a pocket-friendly case.',
    priceCents: 129900,
    stock: 42,
    sku: 'CART-ELE-001',
    categorySlug: 'electronics',
    imageUrls: [productImage('earbuds', 'boAt Airdopes 141')],
  },
  {
    name: 'Noise ColorFit Pro 5',
    slug: 'smartwatch',
    description: 'A sharp AMOLED smartwatch with bluetooth calling, 100 plus sports modes and up to 7 days of battery life.',
    priceCents: 249900,
    stock: 28,
    sku: 'CART-ELE-002',
    categorySlug: 'electronics',
    imageUrls: [productImage('watch', 'Noise ColorFit Pro 5')],
  },
  {
    name: 'JBL Go 3 Bluetooth Speaker',
    slug: 'bluetooth-speaker',
    description: 'Pocket-sized waterproof speaker with rich JBL sound, USB-C charging and a carry loop for travel.',
    priceCents: 279900,
    stock: 18,
    sku: 'CART-ELE-003',
    categorySlug: 'electronics',
    imageUrls: [productImage('speaker', 'JBL Go 3')],
  },
  {
    name: 'Prestige Omega Non-Stick Kadai',
    slug: 'nonstick-cookware',
    description: 'A 24 cm non-stick kadai with a tempered glass lid, induction-compatible base and easy-clean coating.',
    priceCents: 89900,
    stock: 30,
    sku: 'CART-HOM-001',
    categorySlug: 'home-kitchen',
    imageUrls: [productImage('cookware', 'Prestige Kadai')],
  },
  {
    name: 'Milton Thermosteel Bottle',
    slug: 'coffee-maker',
    description: 'A 1 litre stainless steel bottle that keeps drinks hot or cold for hours, with a leak-proof lid for daily commutes.',
    priceCents: 64900,
    stock: 55,
    sku: 'CART-HOM-002',
    categorySlug: 'home-kitchen',
    imageUrls: [productImage('bottle', 'Milton Thermosteel')],
  },
  {
    name: 'Home Story Cotton Bedsheet',
    slug: 'cotton-bedsheet',
    description: 'Soft 144 TC cotton double bedsheet with a warm floral print and two matching pillow covers.',
    priceCents: 119900,
    stock: 22,
    sku: 'CART-HOM-003',
    categorySlug: 'home-kitchen',
    imageUrls: [productImage('bedsheet', 'Cotton Bedsheet')],
  },
  {
    name: 'Atomic Habits',
    slug: 'novel',
    description: 'James Clear’s practical guide to building good habits, breaking bad ones and making small changes that last.',
    priceCents: 39900,
    stock: 80,
    sku: 'CART-BOK-001',
    categorySlug: 'books',
    imageUrls: [productImage('book', 'Atomic Habits')],
  },
  {
    name: 'The Bhagavad Gita',
    slug: 'the-bhagavad-gita',
    description: 'A compact edition of the Bhagavad Gita with clear translations and notes for everyday reflection.',
    priceCents: 24900,
    stock: 60,
    sku: 'CART-BOK-002',
    categorySlug: 'books',
    imageUrls: [productImage('book', 'Bhagavad Gita')],
  },
  {
    name: 'Wings of Fire',
    slug: 'wings-of-fire',
    description: 'Dr. A.P.J. Abdul Kalam’s autobiography, tracing the journey from a small town to India’s space programme.',
    priceCents: 19900,
    stock: 70,
    sku: 'CART-BOK-003',
    categorySlug: 'books',
    imageUrls: [productImage('book', 'Wings of Fire')],
  },
  {
    name: 'Slovic 6 mm Yoga Mat',
    slug: 'yoga-mat',
    description: 'A non-slip 6 mm yoga mat with good cushioning and a carry strap, designed for home practice and studio sessions.',
    priceCents: 89900,
    stock: 25,
    sku: 'CART-FIT-001',
    categorySlug: 'fitness',
    imageUrls: [productImage('yoga', 'Slovic Yoga Mat')],
  },
  {
    name: 'Ownlife Dumbbell Set 5 kg',
    slug: 'dumbbell-set',
    description: 'Compact neoprene dumbbells with comfortable grips, ideal for strength training and light home workouts.',
    priceCents: 149900,
    stock: 12,
    sku: 'CART-FIT-002',
    categorySlug: 'fitness',
    imageUrls: [productImage('dumbbell', 'Dumbbell Set')],
  },
  {
    name: 'Strauss Skipping Rope',
    slug: 'skipping-rope',
    description: 'Adjustable skipping rope with soft foam handles and a ball-bearing swivel for smooth cardio sessions.',
    priceCents: 29900,
    stock: 40,
    sku: 'CART-FIT-003',
    categorySlug: 'fitness',
    imageUrls: [productImage('rope', 'Skipping Rope')],
  },
  {
    name: 'Urban Forest Leather Wallet',
    slug: 'leather-wallet',
    description: 'A slim bifold wallet with multiple card slots, a secure note compartment and a clean stitched finish.',
    priceCents: 109900,
    stock: 26,
    sku: 'CART-ACC-001',
    categorySlug: 'accessories',
    imageUrls: [productImage('wallet', 'Leather Wallet')],
  },
  {
    name: 'Titan Polarized Sunglasses',
    slug: 'titan-sunglasses',
    description: 'Lightweight polarized sunglasses with UV protection and a classic frame for everyday wear.',
    priceCents: 189900,
    stock: 16,
    sku: 'CART-ACC-002',
    categorySlug: 'accessories',
    imageUrls: [productImage('sunglasses', 'Titan Sunglasses')],
  },
  {
    name: 'Wildcraft Laptop Backpack',
    slug: 'laptop-backpack',
    description: 'A durable 25 L backpack with a padded laptop sleeve, organised pockets and water-resistant fabric.',
    priceCents: 129900,
    stock: 34,
    sku: 'CART-ACC-003',
    categorySlug: 'accessories',
    imageUrls: [productImage('backpack', 'Laptop Backpack')],
  },
  {
    name: 'Campus Running Sneakers',
    slug: 'running-shoes',
    description: 'Breathable everyday sneakers with cushioned soles and a flexible upper for walks, runs and college days.',
    priceCents: 149900,
    stock: 24,
    sku: 'CART-FAS-001',
    categorySlug: 'fashion',
    imageUrls: [productImage('shoe', 'Campus Sneakers')],
  },
  {
    name: 'Roadster Cotton T-Shirt',
    slug: 'roadster-tshirt',
    description: 'A soft cotton casual t-shirt with a regular fit and a clean neckline, made for warm Indian days.',
    priceCents: 59900,
    stock: 38,
    sku: 'CART-FAS-002',
    categorySlug: 'fashion',
    imageUrls: [productImage('shirt', 'Roadster T-Shirt')],
  },
  {
    name: 'Biba Cotton Kurta Set',
    slug: 'biba-kurta-set',
    description: 'An easy cotton kurta set with a coordinated dupatta, comfortable for workdays, festivals and family gatherings.',
    priceCents: 189900,
    stock: 20,
    sku: 'CART-FAS-003',
    categorySlug: 'fashion',
    imageUrls: [productImage('kurta', 'Biba Kurta Set')],
  },
]

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminName = process.env.ADMIN_NAME
  const adminPassword = process.env.ADMIN_PASSWORD
  const customerEmail = process.env.SEED_CUSTOMER_EMAIL
  const customerName = process.env.SEED_CUSTOMER_NAME
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD

  if (!adminEmail || !adminName || !adminPassword || !customerEmail || !customerName || !customerPassword) {
    throw new Error('Seed requires ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, SEED_CUSTOMER_EMAIL, SEED_CUSTOMER_NAME and SEED_CUSTOMER_PASSWORD.')
  }

  const adminHash = await bcrypt.hash(adminPassword, 10)
  const customerHash = await bcrypt.hash(customerPassword, 10)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName, passwordHash: adminHash, role: 'ADMIN' },
    create: { name: adminName, email: adminEmail, passwordHash: adminHash, role: 'ADMIN' },
  })

  await prisma.user.upsert({
    where: { email: customerEmail },
    update: { name: customerName, passwordHash: customerHash, role: 'CUSTOMER' },
    create: { name: customerName, email: customerEmail, passwordHash: customerHash, role: 'CUSTOMER' },
  })

  const categories = await Promise.all(categoriesData.map((category) => prisma.category.upsert({
    where: { slug: category.slug },
    update: { name: category.name, description: category.description },
    create: category,
  })))

  const categoryIdBySlug = new Map(categories.map((category) => [category.slug, category.id]))

  await prisma.product.deleteMany({
    where: { slug: { in: legacySlugs } },
  })

  for (const product of productsData) {
    const categoryId = categoryIdBySlug.get(product.categorySlug)
    if (!categoryId) throw new Error(`Seed category not found: ${product.categorySlug}`)

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        imageUrls: product.imageUrls,
        stock: product.stock,
        sku: product.sku,
        isActive: true,
        deletedAt: null,
        categoryId,
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        priceCents: product.priceCents,
        imageUrls: product.imageUrls,
        stock: product.stock,
        sku: product.sku,
        isActive: true,
        categoryId,
      },
    })
  }

  console.log(`Seeded ${categories.length} categories and ${productsData.length} sample products.`)
}

main()
  .catch(() => {
    console.error('Seed failed. Ensure DATABASE_URL is configured and migrations are applied.')
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
