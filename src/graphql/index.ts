import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { gql } from 'graphql-tag';
import { prisma } from '../config/prisma';

// GraphQL schema definition
export const typeDefs = gql`
  type Meal {
    id: String!
    chefId: Int!
    name: String!
    price: Float!
    # Add other meal fields as needed
  }

  type Order {
    id: String!
    customerId: Int!
    chefId: Int!
    mealId: Int!
    quantity: Int!
    totalPrice: Float!
    status: String!
    deliveryType: String
    deliveryAddress: String
    specialInstructions: String
    paymentStatus: Boolean
    paymentMethod: String
    meal: Meal
    # Add other order fields as needed
  }

  type Query {
    orders(customerId: String): [Order!]!
    meals: [Meal!]!
  }
`;

// GraphQL resolvers
export const resolvers = {
  Query: {
    orders: async (_: any, args: { customerId?: string }) => {
      const where = args.customerId ? { customerId: args.customerId } : {};
      return prisma.order.findMany({
        where,
        include: { meal: true },
      });
    },
    meals: async () => {
      return prisma.meal.findMany();
    },
  },
  Order: {
    meal: (parent: any) => {
      return prisma.meal.findUnique({ where: { id: parent.mealId } });
    },
  },
};

// Function to apply GraphQL to Express app
export async function applyGraphQL(app: any) {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  app.use('/graphql', expressMiddleware(server));
}
