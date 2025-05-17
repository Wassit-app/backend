// import CheckAppMw from "@business/middlewares/app/auth.mw";
// import CheckAuthMw from "@business/middlewares/auth.mw";
// import PrivateRoute from "./private/index";
import PublicRoute from "./public/index";

import { Router } from "express";

const router = Router();

router.use("/public", PublicRoute);
// router.use("/private", CheckAuthMw, CheckAppMw, PrivateRoute);

export default router;