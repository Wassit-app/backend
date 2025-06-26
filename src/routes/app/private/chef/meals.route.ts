import { Router } from 'express';
import MealController from '../../../../controllers/app/private/chef/meal.controller';

const router = Router();

router.post('/meals', MealController.createMeal);
router.get('/meals/chef/:chefId', MealController.getMeals);
router.get('/meals/:id', MealController.getMealById); // Assuming this is to get a specific meal by ID
router.put('/meals/:id', MealController.updateMeal);
router.delete('/meals/:id', MealController.deleteMeal);
router.get('/orders/chef/:chefId', MealController.getOrdersForChef); // Assuming this is to get orders for a specific chef

export default router;