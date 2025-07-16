import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { gql } from 'graphql-tag';
import { prisma } from '../config/prisma';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { isChef } from '../middlewares/isChef.middleware';
import { isCustomer } from '../middlewares/isCustomer.middleware';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

// GraphQL schema definition
export const typeDefs = gql`
  type Meal {
    id: String!
    chefId: String!
    name: String!
    description: String!
    price: Float!
    photoUrl: String!
    category: String!
    preparationTime: Int!
    isAvailable: Boolean!
    createdAt: String!
    updatedAt: String!
    avgRating: Float!
  }

  type Chef {
    id: String!
    address: String
    bio: String
    avgReviewScore: Float
    totalReviews: Int
    availableMeals: [Meal!]!
    certification: String
  }

  type Order {
    id: String!
    customerId: String!
    chefId: String!
    mealId: String!
    quantity: Int!
    totalPrice: Float!
    status: String!
    deliveryType: String
    deliveryAddress: String
    specialInstructions: String
    paymentStatus: Boolean
    paymentMethod: String
    meal: Meal
    chef: Chef
  }

  type Query {
    orders(customerId: String, chefId: String, id: String, page: Int, limit: Int): [Order!]!
    meals(chefId: String, id: String, category: String, page: Int, limit: Int): [Meal!]!
  }
`;

// Helper to check role in resolvers
const requireRole = (role: 'chef' | 'customer', context: any) => {
  if (role === 'chef') {
    if (!context.isChef) {
      throw new Error('Access denied: Chef role required');
    }
  } else if (role === 'customer') {
    if (!context.isCustomer) {
      throw new Error('Access denied: Customer role required');
    }
  }
};

// GraphQL resolvers
export const resolvers = {
  Query: {
    orders: async (
      _: any,
      args: { customerId?: string; chefId?: string; id?: string; page?: number; limit?: number },
      context: any,
    ) => {
      requireRole('customer', context); // Only customers can view orders
      const { customerId, chefId, id, page = 1, limit = 10 } = args;
      const { RedisClient } = context;

      // If id is provided, return a single order (as array for consistency)
      if (id) {
        const cacheKey = `orderById:${id}`;
        const cachedOrder = await RedisClient?.get(cacheKey);
        if (cachedOrder) {
          console.log(`Cache hit for ${cacheKey}`);
          return [JSON.parse(cachedOrder)];
        }
        const order = await prisma.order.findUnique({
          where: { id },
          include: { meal: true },
        });
        if (order) await RedisClient?.setex(cacheKey, 300, JSON.stringify(order));
        return order ? [order] : [];
      }

      // If customerId is provided, filter by customerId with pagination
      if (customerId) {
        const cacheKey = `ordersByCustomer:${customerId}:${page}:${limit}`;
        const cachedOrders = await RedisClient?.get(cacheKey);
        if (cachedOrders) {
          console.log(`Cache hit for ${cacheKey}`);
          return JSON.parse(cachedOrders);
        }
        const skip = (page - 1) * limit;
        const orders = await prisma.order.findMany({
          where: { customerId },
          include: { meal: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        });
        await RedisClient?.setex(cacheKey, 300, JSON.stringify(orders));
        return orders;
      }

      // If chefId is provided, filter by chefId with pagination
      if (chefId) {
        const cacheKey = `ordersByChef:${chefId}:${page}:${limit}`;
        const cachedOrders = await RedisClient?.get(cacheKey);
        if (cachedOrders) {
          console.log(`Cache hit for ${cacheKey}`);
          return JSON.parse(cachedOrders);
        }
        const skip = (page - 1) * limit;
        const orders = await prisma.order.findMany({
          where: { chefId },
          include: { meal: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        });
        await RedisClient?.setex(cacheKey, 300, JSON.stringify(orders));
        return orders;
      }

      // Default: return all orders (not recommended, but fallback)
      return [];
    },
    meals: async (
      _: any,
      args: { chefId?: string; id?: string, category?: string, page?: number, limit?: number },
      context: any,
    ) => {
      const { chefId, id, category, page = 1, limit = 10 } = args;
      const { RedisClient } = context;

      // Allow both customers and chefs to access
      if (!context.isChef && !context.isCustomer) {
        throw new Error('Access denied: Must be customer or chef');
      }
      // If id is provided, return an array with the specific meal (to match return type [Meal!])
      if (id) {
        const cacheKey = `mealById:${id}`;
        const cachedMeal = await RedisClient?.get(cacheKey);
        if (cachedMeal) {
          console.log(`Cache hit for ${cacheKey}`);
          return JSON.parse(cachedMeal);
        }
        const meal = await prisma.meal.findUnique({ where: { id: args.id } });
        await RedisClient?.setex(cacheKey, 300, JSON.stringify(meal));
        return meal ? [meal] : [];
      }
      // If chefId is provided, return meals for that chefId (for both roles)
      if (chefId) {
        // return await prisma.meal.findMany({ where: { chefId: args.chefId } });
        const cacheKey = `mealsByChef:${chefId}:${page}:${limit}`;
        const cachedMeals = await RedisClient?.get(cacheKey);
        if (cachedMeals) {
          console.log(`Cache hit for ${cacheKey}`);
          return JSON.parse(cachedMeals);
        }
        const skip = (page - 1) * limit;
        const meals = await prisma.meal.findMany({
          where: { chefId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        });
        await RedisClient?.setex(cacheKey, 300, JSON.stringify(meals));
        return meals;
      }
      // If category is provided, filter meals by category
      if (category) {
        const cacheKey = `mealsByCategory:${category}:${page}:${limit}`;
        const cachedMeals = await RedisClient?.get(cacheKey);
        if (cachedMeals) {
          console.log(`Cache hit for ${cacheKey}`);
          return JSON.parse(cachedMeals);
        }
        const skip = (page - 1) * limit;
        const meals = await prisma.meal.findMany({
          where: { category: category as any }, // Cast to enum type if necessary
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        });
        await RedisClient?.setex(cacheKey, 300, JSON.stringify(meals));
        return meals;
      }
      if (context.isChef) {
        // Chef: only get their own meals if no chefId is provided
        return await prisma.meal.findMany({
          where: { chefId: context.user.id },
        });
      }
      // Customer: get all meals if no chefId is provided
      return await prisma.meal.findMany();
    },
  },
  Order: {
    meal: (parent: any) => {
      return prisma.meal.findUnique({ where: { id: parent.mealId } });
    },
    chef: (parent: any) => {
      return prisma.chef.findUnique({ where: { id: parent.chefId } });
    },
  },
};

// Compose role flags for context using your own middlewares
const roleFlagMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let isChefResult = false;
  let isCustomerResult = false;
  if (req.user) {
    if (req.user.role === 'chef') isChefResult = true;
    if (req.user.role === 'customer') isCustomerResult = true;
  }
  (req as any).isChef = isChefResult;
  (req as any).isCustomer = isCustomerResult;
  (req as any).RedisClient = req.RedisClient; // Ensure RedisClient is available in the request
  next();
};

// function to apply graphQL to Express app
export async function applyGraphQL(app: any, redisClient: Redis) {
  
  app.use(
    '/graphql',
    (req: Request, res: Response, next: NextFunction) => {
      req.RedisClient = redisClient;
      next();
    },
    isAuthenticated,
    roleFlagMiddleware
  );

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => ({
        user: (req as any).user,
        isChef: (req as any).isChef,
        isCustomer: (req as any).isCustomer,
        RedisClient: (req as any).RedisClient,
      }),
    }),
  );
}
