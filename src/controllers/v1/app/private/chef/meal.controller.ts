import { Request, Response, NextFunction } from 'express';
import {
  mealValidator,
  updateMealValidator,
} from '../../../../../validator/app/chef/meal.validator';
import { prisma } from '../../../../../config/prisma';
import logger from '../../../../../utils/logger';

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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const startIndex = (page - 1) * limit;

      const cacheKey = `mealsByChef:${page}:${limit}`;
      const cachedPosts = await req?.RedisClient?.get(cacheKey);
      console.log('Cache posts:', cachedPosts);

      if (cachedPosts) {
        logger.info('Post retrieved from cache', { cacheKey });
        res.json(JSON.parse(cachedPosts));
        return;
      }

      const chef = await prisma.chef.findUnique({ where: { id: chefId } });
      if (!chef) {
        res.status(404).json({
          message: 'Chef not found',
          error: { code: 'CHEF_NOT_FOUND' },
        });
        return;
      }

      const [meals, total] = await Promise.all([
        prisma.meal.findMany({
          where: { chefId },
          orderBy: { createdAt: 'desc' },
          skip: (startIndex) * limit,
          take: limit,
        }),
        prisma.meal.count({ where: { chefId } }),
      ]);
      // Cache the meals
      await req?.RedisClient?.setex(cacheKey, 300, JSON.stringify(meals));

      res.status(200).json({
        meals,
        pagination: {
          page: page,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
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

      res.status(200).json({
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
  private static invalidatePostCashe = async (req: Request, input: string) => {
    const cashedKey = `posts:${input}`;
    await req?.RedisClient?.del(cashedKey);

    const keys = await req?.RedisClient?.keys('posts:*');
    if (!keys) {
      return logger.error('Keys is underfined');
    }
    if (keys.length > 0) {
      await req?.RedisClient?.del(keys);
    }
  };
}
export default MealController;
