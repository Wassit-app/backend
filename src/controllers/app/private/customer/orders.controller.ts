import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../../config/prisma';
import { OrderSchema } from '../../../../validator/app/customer/orders.validator';

export default class OrdersController {
  public static async createOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // Get customerId from authenticated user
      const customerId = req.user?.id;
      if (!customerId) {
        next({ 
            status: 401,
            message: 'Unauthorized: No customer ID', 
            error: { code: 'UNAUTHORIZED', details: 'No customer ID provided' },
        });
        return;
      }

      const { value, error } = OrderSchema.validate(req.body);
      if (error) {
        next({
          status: 400,
          message: error.details[0].message,
          error: {
            code: 'VALIDATION_ERROR',
            details: error.details[0].message,
          },
        });
        return;
      }

      const {
        mealId,
        quantity,
        deliveryType,
        deliveryAddress,
        specialInstructions,
        paymentMethod,
      } = value;


      // Find the meal and get chefId
      const meal = await prisma.meal.findUnique({ where: { id: mealId } });
      if (!meal) {
        res.status(404).json({ message: 'Meal not found' });
        return;
      }
      const chefId = meal.chefId;
      const totalPrice = meal.price * quantity;

      // Create the order
      const order = await prisma.order.create({
        data: {
          customerId,
          chefId,
          mealId,
          quantity,
          totalPrice,
          status: 'PENDING',
          deliveryType,
          deliveryAddress,
          specialInstructions,
          paymentStatus: false,
          paymentMethod,
        },
      });

      res.status(201).json({ message: 'Order created', data: order });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error });
    }
  }

  // Get all orders
  public static async getAllOrders(req: Request, res: Response) {
    // TODO: Fetch orders from database
    res.json({ message: 'Get all orders' });
  }

  // Get a single order by ID
  public static async getOrderById(req: Request, res: Response) {
    const { id } = req.params;
    // TODO: Fetch order by id from database
    res.json({ message: `Get order with id ${id}` });
  }

  // Create a new order

  // Update an existing order
  public static async updateOrder(req: Request, res: Response) {
    const { id } = req.params;
    const updateData = req.body;
    // TODO: Update order in database
    res.json({ message: `Order ${id} updated`, data: updateData });
  }

  // Delete an order
  public static async deleteOrder(req: Request, res: Response) {
    const { id } = req.params;
    // TODO: Delete order from database
    res.json({ message: `Order ${id} deleted` });
  }
}
