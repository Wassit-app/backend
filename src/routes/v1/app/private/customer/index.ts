import { Router } from 'express';
import PublicMealsController from '../../../../../controllers/v1/app/private/customer/meals.controller';
import OrdersController from '../../../../../controllers/v1/app/private/customer/orders.controller';
import CustomerProfileController from '../../../../../controllers/v1/app/private/customer/profile.controller';

const router = Router();


router.get('/profile', CustomerProfileController.getProfile);
router.put('/profile', CustomerProfileController.updateProfile);

router.get('/meals/search', PublicMealsController.searchMealsByLocation);
router.get('/meals/:id', PublicMealsController.getMealDetails);


router.post('/orders', OrdersController.createOrder);
router.get('/orders/:id', OrdersController.getOrderById);
router.delete('/orders/:id', OrdersController.deleteOrder);
router.get(
  '/orders/customer/:customerId',
  OrdersController.getOrdersForCustomer,
);
router.put('/location', OrdersController.updateCustomerLocation);

export default router;
