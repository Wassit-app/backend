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
  }

  type Query {
    orders(customerId: String): [Order!]!
    meals: [Meal!]!
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
    orders: async (_: any, args: { customerId?: string }, context: any) => {
      requireRole('customer', context); // Only customers can view orders
      const where = args.customerId ? { customerId: args.customerId } : {};
      return prisma.order.findMany({
        where,
        include: { meal: true },
      });
    },
    meals: async (_: any, __: any, context: any) => {
      requireRole('chef', context); // Only chefs can view meals
      return prisma.meal.findMany();
    },
  },
  Order: {
    meal: (parent: any) => {
      return prisma.meal.findUnique({ where: { id: parent.mealId } });
    },
  },
};

// Compose role flags for context using your own middlewares
const roleFlagMiddleware = (req: Request, res: Response, next: NextFunction) => {
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
