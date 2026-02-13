import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  listenersAdded?: boolean
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

// Handle connection cleanup - only add listeners once
if (typeof window === 'undefined' && !globalForPrisma.listenersAdded) {
  globalForPrisma.listenersAdded = true
  
  // Graceful shutdown
  const shutdownHandler = async () => {
    await prisma.$disconnect()
  }
  
  process.once('beforeExit', shutdownHandler)
  process.once('SIGINT', shutdownHandler)
  process.once('SIGTERM', shutdownHandler)
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
