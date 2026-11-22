import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config()

const prisma = new PrismaClient()
const expectedTables = ['User', 'RefreshToken', 'Category', 'Product', 'Cart', 'CartItem', 'Order', 'OrderItem', 'OrderEvent', '_prisma_migrations']

async function main() {
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = current_schema() AND table_type = 'BASE TABLE'
  `
  const found = new Set(tables.map((table) => table.table_name))
  const missing = expectedTables.filter((table) => !found.has(table))
  if (missing.length > 0) throw new Error(`Missing tables: ${missing.join(', ')}`)

  const suffix = Date.now().toString()
  const category = await prisma.category.create({
    data: {
      name: `Verification ${suffix}`,
      slug: `verification-${suffix}`,
      description: 'Temporary test category.',
    },
  })
  const product = await prisma.product.create({
    data: {
      name: `Verification Product ${suffix}`,
      slug: `verification-product-${suffix}`,
      description: 'Temporary test product.',
      priceCents: 1234,
      imageUrls: ['https://placehold.co/600x400/png?text=Verify'],
      stock: 1,
      sku: `VERIFY-${suffix}`,
      categoryId: category.id,
    },
  })
  const retrieved = await prisma.product.findUniqueOrThrow({
    where: { id: product.id },
    include: { category: true },
  })
  await prisma.product.delete({ where: { id: product.id } })
  await prisma.category.delete({ where: { id: category.id } })

  const counts = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
  }

  console.log(`Verified tables: ${expectedTables.join(', ')}.`)
  console.log(`Verified insert/read: ${retrieved.name} in ${retrieved.category.name}.`)
  console.log(`Current test data counts: ${counts.users} users, ${counts.categories} categories, ${counts.products} products.`)
}

main()
  .catch(() => {
    console.error('Database verification failed. Ensure DATABASE_URL is configured and migrations are applied.')
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
