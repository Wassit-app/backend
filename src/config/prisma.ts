import { PrismaClient } from '../../generated/prisma'
import { withAccelerate } from '@prisma/extension-accelerate'

// Create a new PrismaClient instance with Accelerate extension
export const prisma = new PrismaClient().$extends(withAccelerate())