import { Router } from 'express';
import MealController from '../../../../controllers/app/private/chef/meal.controller';
import { isAuthenticated } from '../../../../middlewares/auth.middleware';
import { isChef } from '../../../../middlewares/isChef.middleware';

const router = Router();

router.post('/meals', MealController.createMeal);
router.get('/meals/chef/:chefId', MealController.getMeals);
router.get('/meals/:id', MealController.getMealById); // Assuming this is to get a specific meal by ID
router.put('/meals/:id', MealController.updateMeal);
router.delete('/meals/:id', MealController.deleteMeal);

export default router;