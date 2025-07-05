// import CheckAppMw from "@business/middlewares/app/auth.mw";
// import CheckAuthMw from "@business/middlewares/auth.mw";
import { isAuthenticated } from "../../middlewares/auth.middleware";
import { isChef } from "../../middlewares/isChef.middleware";
import { isCustomer } from "../../middlewares/isCustomer.middleware";
import ChefPrivateRoute from "./private/chef/meals.route";
import CustomerPrivateRoute from "./private/customer/orders.route";
import PublicRoute from "./public/index";
import FilterRouter from './private/customer/meals.route'

import { Router } from "express";

const router = Router();

router.use("/public", PublicRoute);
router.use('/private/chef-management', isAuthenticated, isChef, ChefPrivateRoute);
router.use('/private/customer-management', isAuthenticated, isCustomer, CustomerPrivateRoute);
router.use('/private/customer-management', isAuthenticated, isCustomer, FilterRouter);


export default router;