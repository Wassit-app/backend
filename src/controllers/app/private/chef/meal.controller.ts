import { Request, Response, NextFunction } from 'express';
import { mealValidator } from '../../../../validator/app/chef/meal.validator';
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
    // Logic to retrieve meals
    res.status(200).send({ meals: [] });
  };
  public static getMealById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    // Logic to retrieve meals
    res.status(200).send({ meals: [] });
  };

  public static updateMeal = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    // Logic to update a meal
    res.status(200).send({ message: 'Meal updated successfully' });
  };

  public static deleteMeal = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    // Logic to delete a meal
    res.status(200).send({ message: 'Meal deleted successfully' });
  };
}
export default MealController;
