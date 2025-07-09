import { isAuthenticated } from '../../../middlewares/auth.middleware';
import { isChef } from '../../../middlewares/isChef.middleware';
import { isCustomer } from '../../../middlewares/isCustomer.middleware';

import PublicRoute from './public/index';
import CustomerRoutes from '../app/private/customer/index';
import ChefRoutes from '../app/private/chef/index';

import { Router } from 'express';

const router = Router();

router.use('/public', PublicRoute);
router.use('/private/chef-management', isAuthenticated, isChef, ChefRoutes);
router.use('/private/customer-management',isAuthenticated,isCustomer,CustomerRoutes);


export default router;
