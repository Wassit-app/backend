import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { gql } from 'graphql-tag';
import { prisma } from '../config/prisma';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { isChef } from '../middlewares/isChef.middleware';
import { isCustomer } from '../middlewares/isCustomer.middleware';
import { Request, Response, NextFunction } from 'express';

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
    orders(customerId: String, chefId: String, id: String): [Order!]!
    meals(chefId: String, id: String): [Meal!]!
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
      args: { customerId?: string; chefId?: string; id?: string },
      context: any,
    ) => {
      requireRole('customer', context); // Only customers can view orders
      // If customerId is provided, filter by customerId
      if (args.customerId) {
        const where = args.customerId ? { customerId: args.customerId } : {};
        return prisma.order.findMany({
          where,
          include: { meal: true },
        });
      }
      if (args.chefId) {
        const where = args.chefId ? { chefId: args.chefId } : {};
        return prisma.order.findMany({
          where,
          include: { meal: true },
        });
      }
      // If id is provided, return a single order
      if (args.id) {
        return prisma.order.findUnique({
          where: { id: args.id },
          include: { meal: true },
        });
      }
    },
    meals: async (
      _: any,
      args: { chefId?: string; id?: string },
      context: any,
    ) => {
      // Allow both customers and chefs to access
      if (!context.isChef && !context.isCustomer) {
        throw new Error('Access denied: Must be customer or chef');
      }
      // If id is provided, return an array with the specific meal (to match return type [Meal!])
      if (args.id) {
        const meal = await prisma.meal.findUnique({ where: { id: args.id } });
        return meal ? [meal] : [];
      }
      // If chefId is provided, return meals for that chefId (for both roles)
      if (args.chefId) {
        return await prisma.meal.findMany({ where: { chefId: args.chefId } });
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
    if (req.user.role === 'CHEF') isChefResult = true;
    if (req.user.role === 'CUSTOMER') isCustomerResult = true;
  }
  (req as any).isChef = isChefResult;
  (req as any).isCustomer = isCustomerResult;
  next();
};

// function to apply graphQL to Express app
export async function applyGraphQL(app: any) {
  app.use('/graphql', isAuthenticated, roleFlagMiddleware);

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
      }),
    }),
  );
}
