import { PrismaClient } from '@prisma/client'


// Create a new PrismaClient instance
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})