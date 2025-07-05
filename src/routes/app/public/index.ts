import { Router } from "express";
import passport from "passport";
import AuthController from "../../../controllers/app/public/auth.controller";
import config from "../../../config/config";

const router = Router();

router.post("/auth/register", AuthController.register);
router.post("/auth/register-complete", AuthController.completeRegister);
router.post("/auth/login", AuthController.login);
router.post("/auth/forget-password", AuthController.reqResetPassword);
router.post("/auth/confirm-forget-password", AuthController.confirmResetPassword);
router.post("/auth/refresh-token", AuthController.checkRefreshToken);
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);
router.get("/auth/google/callback",
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req: any, res) => {
        const { tokens, user } = req.user;

        // Set tokens as HTTP-only cookies
        res.cookie('accessToken', tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Redirect to frontend with success status
        res.redirect(`${config.frontend.url}${config.frontend.authSuccessPath}`);
    }
);

// Include meals routes

export default router;