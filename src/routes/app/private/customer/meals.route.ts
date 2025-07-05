import { Router } from 'express';
import PublicMealsController from '../../../../controllers/app/private/customer/meals.controller';

const router = Router();

// Public routes for meal search (no authentication required)
router.get('/meals/search', PublicMealsController.searchMealsByLocation);
router.get('/meals/:id', PublicMealsController.getMealDetails);

export default router; 