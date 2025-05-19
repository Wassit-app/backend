import { Router } from "express";

import AuthController from "../../../controllers/app/public/auth.controller";

const router = Router();

router.post("/auth/register", AuthController.register);
router.post("/auth/register-complete", AuthController.completeRegister);
router.post("/auth/login", AuthController.login);
router.post("/auth/forget-password", AuthController.reqResetPassword);
router.post("/auth/confirm-forget-password", AuthController.confirmResetPassword);
router.post("/auth/refresh-token", AuthController.checkRefreshToken);

export default router;