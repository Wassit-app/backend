import { NextFunction, Request, Response } from 'express';
import { ProfileValidator } from '../../../../../validator/app/customer/profile.validator';
import { prisma } from '../../../../../config/prisma';
import HashService from '../../../../../service/hash';


export default class CustomerProfileController {
  // Method to get customer profile
  static async getProfile(req: Request, res: Response, next: NextFunction) {
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
      
      res.status(200).json({
        message: 'Get Profile Success',
        data: {
          ...req.user,
        },
      });
    } catch (error) {
      console.error('ProfileController.getProfile', error);
      return next({
        status: 500,
        message: 'Internal Server Error',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          details: 'Internal Server Error',
        },
      });
    }
  }

  // Method to update customer profile
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = ProfileValidator.validate(req.body);
      const user = req.user;

      if (error)
        return next({
          status: 400,
          message: error.details[0].message,
          error: {
            code: 'VALIDATION_ERROR',
            details: error.details[0].message,
          },
        });

      // Prepare user update data
      const userUpdateData: any = {};
      if (value.username) userUpdateData.username = value.username;
      if (value.fullName) userUpdateData.fullName = value.fullName;
      if (value.email) userUpdateData.email = value.email;
      if (value.phone) userUpdateData.phone = value.phone;
      if (value.password)
        userUpdateData.password = HashService.hash(value.password);
      if (typeof value.oauthProvider !== 'undefined')
        userUpdateData.oauthProvider = value.oauthProvider;
      if (typeof value.oauthId !== 'undefined')
        userUpdateData.oauthId = value.oauthId;

      // Prepare customer update data
      const customerUpdateData: any = {};
      if (typeof value.deliveryAddress !== 'undefined')
        customerUpdateData.deliveryAddress = value.deliveryAddress;
      if (typeof value.latitude !== 'undefined')
        customerUpdateData.latitude = value.latitude;
      if (typeof value.longitude !== 'undefined')
        customerUpdateData.longitude = value.longitude;
      if (Array.isArray(value.favoriteMeals))
        customerUpdateData.favoriteMeals = value.favoriteMeals;
      if (Array.isArray(value.recentOrders))
        customerUpdateData.recentOrders = value.recentOrders;

      // Transaction: update both User and Customer
      const [updateUser, updateCustomer] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user?.id },
          data: userUpdateData,
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            phone: true,
            isVerified: true,
            role: true,
            createdAt: true,
          },
        }),
        prisma.customer.update({
          where: { id: user?.id },
          data: customerUpdateData,
          select: {
            id: true,
            deliveryAddress: true,
            latitude: true,
            longitude: true,
            favoriteMeals: true,
            recentOrders: true,
          },
        }),
      ]);

      res.status(200).json({
        message: 'User and customer profile updated successfully',
        data: {
          user: updateUser,
          customer: updateCustomer,
        },
      });
    } catch (error) {
      console.error('ProfileController - updateProfile', error);
      return next({
        status: 500,
        message: 'Internal Server Error',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          details: 'Internal Server Error',
        },
      });
    }
  }
}
