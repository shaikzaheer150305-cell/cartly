import dotenv from 'dotenv'
import { createApp } from './app.js'
import { validateProductionEnv } from './lib/env.js'
import { connectDatabase, databaseErrorMessage, disconnectDatabase } from './lib/prisma.js'

if (process.env.NODE_ENV !== 'production') dotenv.config()

validateProductionEnv()

const app = createApp()
const port = Number(process.env.PORT ?? 4000)

connectDatabase().catch((error) => {
  console.error(databaseErrorMessage(error))
})

const server = app.listen(port, () => {
  console.log(`Cartly backend listening on http://localhost:${port}`)
})

const shutdown = async () => {
  try {
    await disconnectDatabase()
  } catch {
    console.error('Database shutdown failed.')
  } finally {
    server.close(() => process.exit(0))
  }
}

process.on('SIGINT', () => { void shutdown() })
process.on('SIGTERM', () => { void shutdown() })
