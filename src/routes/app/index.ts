// import CheckAppMw from "@business/middlewares/app/auth.mw";
// import CheckAuthMw from "@business/middlewares/auth.mw";
import { isAuthenticated } from "../../middlewares/auth.middleware";
import { isChef } from "../../middlewares/isChef.middleware";
import ChefPrivateRoute from "./private/chef/meal.route";
import PublicRoute from "./public/index";

import { Router } from "express";

const router = Router();

router.use("/public", PublicRoute);
router.use('/private', isAuthenticated, isChef, ChefPrivateRoute);

export default router;