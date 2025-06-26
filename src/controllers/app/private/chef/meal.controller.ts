import { Request, Response, NextFunction } from 'express';
import {
  mealValidator,
  updateMealValidator,
} from '../../../../validator/app/chef/meal.validator';
import { prisma } from '../../../../config/prisma';

class MealController {
  // Add methods for handling meal-related requests here
  // For example:

  public static createMeal = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { value, error } = mealValidator.validate(req.body);
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
        chefId,
        name,
        description,
        price,
        photoUrl,
        category,
        preparationTime,
        isAvailable,
      } = value;

      // Check if chef exists
      const chef = await prisma.chef.findUnique({ where: { id: chefId } });
      if (!chef) {
        next({
          status: 404,
          message: 'Chef not found',
          error: {
            code: 'CHEF_NOT_FOUND',
            details: 'Chef not found',
          },
        });
        return;
      }

      // Create the meal
      const meal = await prisma.meal.create({
        data: {
          chefId,
          name,
          description,
          price,
          photoUrl,
          category,
          preparationTime,
          isAvailable,
        },
      });

      res
        .status(201)
        .json({ message: 'Meal created successfully', data: { meal } });
    } catch (error) {
      next({
        status: 500,
        message: 'Internal server error',
        error,
      });
    }
  };

  public static getMeals = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { chefId } = req.params;
      const chef = await prisma.chef.findUnique({ where: { id: chefId } });
      if (!chef) {
        res.status(404).json({
          message: 'Chef not found',
          error: { code: 'CHEF_NOT_FOUND' },
        });
      }

      const meals = await prisma.meal.findMany({
        where: { chefId },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ meals });
    } catch (error) {
      next({
        status: 500,
        message: 'Internal server error',
        error,
      });
    }
  };

  public static getMealById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const meal = await prisma.meal.findUnique({
        where: { id },
      });
      if (!meal) {
        res.status(404).json({
          message: 'Meal not found',
          error: { code: 'MEAL_NOT_FOUND' },
        });
        return;
      }
      res.status(200).json({ meal });
    } catch (error) {
      next({
        status: 500,
        message: 'Internal server error',
        error,
      });
    }
  };

  public static updateMeal = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const { value, error } = updateMealValidator.validate(req.body);
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

      const meal = await prisma.meal.findUnique({ where: { id } });
      if (!meal) {
        res.status(404).json({
          message: 'Meal not found',
          error: { code: 'MEAL_NOT_FOUND' },
        });
        return;
      }

      const updatedMeal = await prisma.meal.update({
        where: { id },
        data: value,
      });

      res
        .status(200)
        .json({
          message: 'Meal updated successfully',
          data: { meal: updatedMeal },
        });
    } catch (error) {
      next({
        status: 500,
        message: 'Internal server error',
        error,
      });
    }
  };

  public static deleteMeal = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const meal = await prisma.meal.findUnique({ where: { id } });
      if (!meal) {
        res.status(404).json({
          message: 'Meal not found',
          error: { code: 'MEAL_NOT_FOUND' },
        });
        return;
      }

      await prisma.meal.delete({ where: { id } });

      res.status(200).json({ message: 'Meal deleted successfully' });
    } catch (error) {
      next({
        status: 500,
        message: 'Internal server error',
        error,
      });
    }
  };

  public static getOrdersForChef = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { chefId } = req.params;
      const orders = await prisma.order.findMany({
        where: { chefId },
        include: {
          meal: true,
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ message: 'Orders Retreived', data: orders });
    } catch (error) {
      next({
        status: 500,
        message: 'Internal server error',
        error,
      });
    }
  };
}
export default MealController;
