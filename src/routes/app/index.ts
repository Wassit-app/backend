// import CheckAppMw from "@business/middlewares/app/auth.mw";
// import CheckAuthMw from "@business/middlewares/auth.mw";
import { isAuthenticated } from "../../middlewares/auth.middleware";
import { isChef } from "../../middlewares/isChef.middleware";
import { isCustomer } from "../../middlewares/isCustomer.middleware";
import ChefPrivateRoute from "./private/chef/meals.route";
import CustomerPrivateRoute from "./private/customer/orders.route";
import PublicRoute from "./public/index";

import { Router } from "express";

const router = Router();

router.use("/public", PublicRoute);
router.use('/private/chefs', isAuthenticated, isChef, ChefPrivateRoute);
router.use('/private/customers', isAuthenticated, isCustomer, CustomerPrivateRoute);

export default router;