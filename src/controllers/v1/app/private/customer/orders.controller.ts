import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../../../config/prisma';
import { OrderSchema } from '../../../../../validator/app/customer/orders.validator';
import { updateCustomerLocationSchema } from '../../../../../validator/app/customer/meals.validator';
import { isValidCoordinates } from '../../../../../utils/location.util';

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
  public static async getOrdersForCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        next({
          status: 401,
          message: 'Unauthorized: No customer ID',
          error: { code: 'UNAUTHORIZED', details: 'No customer ID provided' },
        });
        return;
      }

      const orders = await prisma.order.findMany({
        where: { customerId },
        include: {
          meal: true, // Include meal details
          chef: true, // Include chef details
        },
      });

      res.json({ message: 'Orders retrieved', data: orders });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error });
    }
    
  }

  // Get a single order by ID
  public static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          meal: true, // Include meal details
          chef: true, // Include chef details
          customer: true, // Include customer details
        },
      });

      if (!order) {
        next({
          status: 404,
          message: 'Order not found',
          error: { code: 'ORDER_NOT_FOUND', details: ' No Order with this ID for you' },
        });
        return;
      }

      res.json({ message: 'Order retrieved', data: order });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error });
    }
    
  }

  // Create a new order

  // Update an existing order
  // Delete an order
  public static async deleteOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) {
        next({
          status: 404,
          message: 'Order not found',
          error: { code: 'ORDER_NOT_FOUND', details: 'No Order with this ID for you' },
        });
        return;
      }

      await prisma.order.delete({ where: { id } });

      res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
      next({
        status: 500,
        message: 'Internal server error',
        error,
      });
    }
    
  }

  /**
   * Update customer location coordinates
   */
  public static async updateCustomerLocation(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        next({
          status: 401,
          message: 'Unauthorized: No customer ID',
          error: { code: 'UNAUTHORIZED', details: 'No customer ID provided' },
        });
        return;
      }

      const { value, error } = updateCustomerLocationSchema.validate(req.body);
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

      const { latitude, longitude } = value;

      // Validate coordinates
      if (!isValidCoordinates(latitude, longitude)) {
        next({
          status: 400,
          message: 'Invalid coordinates provided',
          error: {
            code: 'INVALID_COORDINATES',
            details: 'Latitude must be between -90 and 90, longitude between -180 and 180',
          },
        });
        return;
      }

      // Update customer location
      const updatedCustomer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          latitude,
          longitude,
        },
      });

      res.status(200).json({
        message: 'Customer location updated successfully',
        data: {
          latitude: updatedCustomer.latitude,
          longitude: updatedCustomer.longitude,
        },
      });
    } catch (error) {
      next({
        status: 500,
        message: 'Internal server error',
        error,
      });
    }
  }
}
