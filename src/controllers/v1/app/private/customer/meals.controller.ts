import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../../../config/prisma';
import { searchMealsByLocationSchema } from '../../../../../validator/app/customer/meals.validator';
import { calculateDistance, isValidCoordinates } from '../../../../../utils/location.util';
import logger from '../../../../../utils/logger';

export default class PublicMealsController {
  /**
   * Search for meals by location with filtering options
   */
  public static async searchMealsByLocation(
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
      // Validate query parameters
      const { value, error } = searchMealsByLocationSchema.validate(req.query);
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
        latitude,
        longitude,
        radiusKm = 10,
        category,
        minPrice,
        maxPrice,
        page = 1,
        limit = 20,
      } = value;

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

      const startIndex = (page - 1) * limit;

      // Build where clause for meals
      const mealWhereClause: any = {
        isAvailable: true,
      };

      if (category) {
        mealWhereClause.category = category;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        mealWhereClause.price = {};
        if (minPrice !== undefined) {
          mealWhereClause.price.gte = minPrice;
        }
        if (maxPrice !== undefined) {
          mealWhereClause.price.lte = maxPrice;
        }
      }

      // Get all meals with chef information
      const mealsWithChefs = await prisma.meal.findMany({
        where: mealWhereClause,
        include: {
          chef: {
            select: {
              id: true,
              address: true,
              latitude: true,
              longitude: true,
              avgReviewScore: true,
              totalReviews: true,
              user: {
                select: {
                  fullName: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Filter meals by distance and add distance information
      const mealsWithDistance = mealsWithChefs
        .filter((meal) => {
          if (!meal.chef.latitude || !meal.chef.longitude) {
            return false; // Skip meals from chefs without location
          }

          const distance = calculateDistance(
            latitude,
            longitude,
            meal.chef.latitude,
            meal.chef.longitude
          );

          return distance <= radiusKm;
        })
        .map((meal) => {
          const distance = calculateDistance(
            latitude,
            longitude,
            meal.chef.latitude!,
            meal.chef.longitude!
          );

          return {
            ...meal,
            distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          };
        })
        .sort((a, b) => a.distance - b.distance); // Sort by distance

      // Apply pagination
      const total = mealsWithDistance.length;
      const paginatedMeals = mealsWithDistance.slice(startIndex, startIndex + limit);

      // Cache the results if Redis is available
      const cacheKey = `mealsByLocation:${latitude}:${longitude}:${radiusKm}:${category || 'all'}:${page}:${limit}`;
      if (req?.RedisClient) {
        await req.RedisClient.setex(cacheKey, 300, JSON.stringify({
          meals: paginatedMeals,
          pagination: {
            page,
            pageSize: limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        }));
        logger.info('Meals search results cached', { cacheKey });
      }

      res.status(200).json({
        message: 'Meals found successfully',
        data: {
          meals: paginatedMeals,
          pagination: {
            page,
            pageSize: limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          searchParams: {
            latitude,
            longitude,
            radiusKm,
            category: category || 'all',
            minPrice: minPrice || 'any',
            maxPrice: maxPrice || 'any',
          },
        },
      });
    } catch (error) {
      logger.error('Error searching meals by location', { error });
      next({
        status: 500,
        message: 'Internal server error',
        error,
      });
    }
  }

  /**
   * Get meal details by ID with chef location information
   */
  public static async getMealDetails(
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
      
      const { id } = req.params;
      const { latitude, longitude } = req.query;

      const meal = await prisma.meal.findUnique({
        where: { id },
        include: {
          chef: {
            select: {
              id: true,
              address: true,
              latitude: true,
              longitude: true,
              avgReviewScore: true,
              totalReviews: true,
              bio: true,
              user: {
                select: {
                  fullName: true,
                  username: true,
                },
              },
            },
          },
          reviews: {
            include: {
              customer: {
                select: {
                  user: {
                    select: {
                      fullName: true,
                      username: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 5, // Limit to 5 recent reviews
          },
        },
      });

      if (!meal) {
        next({
          status: 404,
          message: 'Meal not found',
          error: { code: 'MEAL_NOT_FOUND' },
        });
        return;
      }

      // Calculate distance if coordinates are provided
      let distance = null;
      if (latitude && longitude && meal.chef.latitude && meal.chef.longitude) {
        const lat = parseFloat(latitude as string);
        const lng = parseFloat(longitude as string);
        
        if (isValidCoordinates(lat, lng)) {
          distance = calculateDistance(lat, lng, meal.chef.latitude, meal.chef.longitude);
          distance = Math.round(distance * 100) / 100;
        }
      }

      res.status(200).json({
        message: 'Meal details retrieved successfully',
        data: {
          ...meal,
          distance,
        },
      });
    } catch (error) {
      logger.error('Error getting meal details', { error });
      next({
        status: 500,
        message: 'Internal server error',
        error,
      });
    }
  }
} 