import { Prisma, PrismaClient } from '@prisma/client'

type PrismaGlobal = typeof globalThis & {
  prisma?: PrismaClient
}

const globalForPrisma = globalThis as PrismaGlobal

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export class DatabaseConnectionError extends Error {
  readonly code: string

  constructor(code = 'UNKNOWN') {
    super('Database is currently unavailable.')
    this.name = 'DatabaseConnectionError'
    this.code = code
  }
}

function connectionCode(error: unknown): string {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return error.errorCode ?? 'INITIALIZATION'
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code
  }
  return 'UNKNOWN'
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect()
  } catch (error) {
    throw new DatabaseConnectionError(connectionCode(error))
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

export function databaseErrorMessage(error: unknown): string {
  if (error instanceof DatabaseConnectionError) {
    return `${error.message} (${error.code})`
  }
  return 'Database is currently unavailable.'
}
