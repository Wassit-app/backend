import { prisma } from './config/prisma'
import { Role } from './generated/prisma'

async function testAccelerate() {
  try {

    
    // Create a test user
    const testUsername = `test_accelerate_${Date.now()}`
    const newUser = await prisma.user.create({
      data: {
        username: testUsername,
        fullName: 'Accelerate Test',
        email: `${testUsername}@example.com`,
        phone: '1234567890',
        password: 'password123',
        role: Role.CUSTOMER,
        customer: {
          create: {
            deliveryAddress: '123 Accelerate St',
            favoriteMeals: [],
            recentOrders: []
          }
        }
      }
    })
    
    console.log(`Created test user with ID: ${newUser.id}`)
    
  } catch (error) {
    console.error('Error testing Prisma Accelerate:', error)
  }
}

testAccelerate()