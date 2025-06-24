import { Request, Response, NextFunction } from "express";
import { confirmResetPasswordSchema, loginSchema, registrationSchema, resetPasswordRequestSchema, validateRegistrationSchema } from "../../../validator/app/auth.validator";
import { prisma } from "../../../config/prisma";
import bcrypt from "bcrypt";
import HashService from "../../../service/hash";
import OtpGenerator from "../../../algorithm/otp.alg";
import SMTPService from "../../../service/smtp";
import TokenService from "../../../service/jwt";


class AuthController {
    public static register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { value, error } = registrationSchema.validate(req.body);

            if (error) {
                next({
                    status: 400,
                    message: error.details[0].message,
                    error: {
                        code: "VALIDATION_ERROR",
                        details: error.details[0].message,
                    },
                });
                return;
            }

            const isEmailExist = await prisma.user.findUnique({
                where: { email: value.email },
            });

            if (isEmailExist && isEmailExist.isVerified) {
                next({
                    status: 409,
                    message: "Email already exists",
                    error: {
                        code: "EMAIL_EXISTS",
                        details: "The email address is already registered",
                    },
                });
                return;
            }

            const hashedPassword = HashService.hash(value.password);
            const otpExpiredAt = new Date(Date.now() + 10 * 60 * 1000);
            const newOtp = OtpGenerator(4);

            let newUser: { id: string };

            if (isEmailExist) {
                newUser = await prisma.user.update({
                    where: { id: isEmailExist.id },
                    data: {
                        otp: newOtp,
                        username: value.username,
                        fullName: value.fullName,
                        email: value.email,
                        password: hashedPassword,
                        expiredAt: otpExpiredAt,
                    },
                    select: { id: true },
                });
            } else {
                newUser = await prisma.user.create({
                    data: {
                        otp: newOtp,
                        username: value.username,
                        fullName: value.fullName,
                        email: value.email,
                        password: hashedPassword,
                        expiredAt: otpExpiredAt,
                        role: value.role,
                    },
                    select: { id: true },
                });
            }

            // Create specific data for role
            if (value.role === "CHEF") {
                await prisma.chef.upsert({
                    where: { id: newUser.id },
                    update: {
                        address: value.address,
                        bio: value.bio,
                        certification: value.certification,
                    },
                    create: {
                        id: newUser.id,
                        address: value.address,
                        bio: value.bio,
                        certification: value.certification,
                        avgReviewScore: 0,
                        totalReviews: 0,
                        availableMeals: [],
                    },
                });

            } else if (value.role === "CUSTOMER") {
                await prisma.customer.upsert({
                    where: { id: newUser.id },
                    update: {
                        deliveryAddress: value.deliveryAddress,
                    },
                    create: {
                        id: newUser.id,
                        deliveryAddress: value.deliveryAddress,
                        favoriteMeals: [],
                        recentOrders: [],
                    },
                });
            }
            await SMTPService.sendAppOTPEmail(value.email, value.name, newOtp);
            res.status(201).json({
                message: "Registration successful. Please verify your email.",
                data: {
                    id: newUser.id,
                },
            });
        } catch (err: any) {
            next({
                status: 500,
                message: "Internal Server Error",
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    details: "Internal Server Error",
                },
            });
            return;
        }
    }
    public static completeRegister = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { error, value } = validateRegistrationSchema.validate(req.body);

            if (error) {
                next({
                    status: 400,
                    message: error.details[0].message,
                    error: {
                        code: "VALIDATION_ERROR",
                        details: error.details[0].message,
                    },
                });
                return;
            }

            let userObj = await prisma.user.findUnique({ where: { id: value.userId } });

            if (!userObj) {
                next({
                    status: 404,
                    message: "User not found",
                    error: {
                        code: "USER_NOT_FOUND",
                        details: "No user found with the provided ID",
                    },
                });
                return;
            }

            if (userObj.isVerified) {
                next({
                    status: 409,
                    message: "User account already verified",
                    error: {
                        code: "ACCOUNT_ALREADY_VERIFIED",
                        details: "The user account is already verified",
                    },
                });
                return;
            }
            if (value.otp !== userObj.otp) {
                next({
                    status: 400,
                    message: "OTP is not correct",
                    error: {
                        code: "OTP_INCORRECT_ERROR",
                        details: "The provided OTP is incorrect",
                    },
                });
                return;
            }
            const currentTime = new Date().getTime();
            if (!userObj.expiredAt || currentTime > new Date(userObj.expiredAt).getTime()) {
                next({
                    status: 400,
                    message: "OTP is expired",
                    error: {
                        code: "OTP_EXPIRED_ERROR",
                        details: "The provided OTP is expired",
                    },
                });
                return;
            }

            let user = await prisma.user.update({
                where: { id: value.userId },
                data: {
                    isVerified: true,
                    otp: null,
                    expiredAt: null,
                },
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    email: true,
                    phone: true,
                },
            })

            const accessToken = TokenService.generateToken(user, userObj.role, "1d");
            const refreshToken = TokenService.generateToken(user, userObj.role, "90d");

            res.status(201).json({
                message: "Registration completed successfully, user validated",
                data: {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    user: user,
                },
            });
        } catch (error) {
            console.log(error);
            next({
                status: 500,
                message: "Internal Server Error",
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    details: "Internal Server Error",
                },
            });
            return;
        }
    }
    public static login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { error, value } = loginSchema.validate(req.body);
            if (error) {
                next({
                    status: 400,
                    message: error.details[0].message,
                    error: {
                        code: "VALIDATION_ERROR",
                        details: error.details[0].message,
                    },
                });
            }

            const user = await prisma.user.findUnique({
                where: { email: value.email },
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    password: true,
                    role: true,
                    isVerified: true,
                }
            });

            if (!user) {
                next({
                    status: 404,
                    message: "Invalid Email",
                    error: {
                        code: "INVALID_EMAIL",
                        details: "The provided email is incorrect",
                    },
                });
                return;
            }

            const isMatch = HashService.compare(value.password, user.password);

            if (!isMatch) {
                next({
                    status: 401,
                    message: "Invalid password",
                    error: {
                        code: "INVALID_PASSWORD",
                        details: "The provided password is incorrect",
                    },
                });
                return;
            }

            const { password, ...safeUser } = user;
            const accessToken = TokenService.generateToken(user, user.role, "1d");
            const refreshToken = TokenService.generateToken(user, user.role, "90d");

            res.status(200).json({
                message: "login succefull",
                data: {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    user: safeUser,
                },
            });
        } catch (error) {
            console.log(error);
            next({
                status: 500,
                message: "Internal Server Error",
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    details: "Internal Server Error",
                },
            });
            return;
        }
    }
    public static reqResetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { error, value } = resetPasswordRequestSchema.validate(req.body);

            if (error) {
                next({
                    status: 400,
                    message: error.details[0].message,
                    error: {
                        code: "VALIDATION_ERROR",
                        details: error.details[0].message,
                    },
                });
                return;
            }
            const user = await prisma.user.findFirst({
                where: { email: value.email },
                select: {
                    id: true,
                    username: true,
                },
            });

            if (!user) {
                next({
                    status: 404,
                    message: "Email not found",
                    error: {
                        code: "EMAIL_NOT_FOUND",
                        details: "The provided email does not exist",
                    },
                });
                return;
            }

            const newOtp = OtpGenerator(4);
            const otpExpiredAt = new Date(Date.now() + 10 * 60 * 1000);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    otp: newOtp,
                    expiredAt: otpExpiredAt,
                },
            });

            await SMTPService.sendAppOTPPasswordReset(value.email, user.username, newOtp);

            res.status(200).json({
                message: "Password reset OTP sent to your email",
                data: {
                    id: user.id,
                },
            });
        } catch (error) {
            console.log(error);
            next({
                status: 500,
                message: "Internal Server Error",
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    details: "Internal Server Error",
                },
            });
            return;
        }
    }

    public static confirmResetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {

            const { error, value } = confirmResetPasswordSchema.validate(req.body);
            if (error) {
                next({
                    status: 400,
                    message: error.details[0].message,
                    error: {
                        code: "VALIDATION_ERROR",
                        details: error.details[0].message,
                    },
                });
                return;
            }

            const user = await prisma.user.findUnique({
                where: { email: value.email },
                select: {
                    id: true,
                    otp: true,
                    expiredAt: true,
                    email: true,
                    role: true,
                    username: true,
                    phone: true,
                },
            });

            if (!user) {
                next({
                    status: 404,
                    message: "Email not found",
                    error: {
                        code: "INVALID_EMAIL",
                        details: "The provided email does not exist",
                    },
                });
                return;
            }

            if (user.otp !== value.otp) {
                next({
                    status: 401,
                    message: "Invalid OTP",
                    error: {
                        code: "INVALID_OTP",
                        details: "The provided OTP is incorrect",
                    },
                });
                return;
            }

            const currentTime = new Date().getTime();
            if (!user.expiredAt || currentTime > user.expiredAt.getTime()) {
                next({
                    status: 401,
                    message: "OTP has expired",
                    error: {
                        code: "OTP_EXPIRED",
                        details: "The provided OTP has expired",
                    },
                });
                return;
            }

            let finalUser = await prisma.user.update({
                where: { id: user.id },
                data: {
                    isVerified: true,
                    otp: null,
                    expiredAt: null,
                },
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    email: true,
                    phone: true,
                },
            })

            const accessToken = TokenService.generateToken(user, user.role, "1d");
            const refreshToken = TokenService.generateToken(user, user.role, "90d");

            res.status(200).json({
                message: "Password reset successfully",
                data: {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    user: finalUser,
                },
            });
        } catch (error) {
            console.log(error);
            next({
                status: 500,
                message: "Internal Server Error",
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    details: "Internal Server Error",
                },
            });
            return;
        }
    }
    public static checkRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.header("Authorization")?.replace("Bearer ", "").trim();

            if (!token) {
                next({
                    status: 400,
                    message: "Authorization header is missing or malformed",
                    error: {
                        code: "INVALID_REFRESH_HEADER",
                        details: "Expected format: Bearer <refresh_token>",
                    },
                });
                return;
            }

            const tokenData = TokenService.verifyToken(token);

            if (!tokenData) {
                return next({
                    status: 401,
                    message: "Invalid or expired refresh token",
                    error: {
                        code: "INVALID_REFRESH_TOKEN",
                        details: "The refresh token is invalid or expired",
                    },
                });
            }

            const { systemRole, ...payloadWithoutRole } = tokenData;

            if (!systemRole) {
                return next({
                    status: 400,
                    message: "Token does not contain a valid role",
                    error: {
                        code: "ROLE_NOT_FOUND",
                        details: "User role was missing in the refresh token payload",
                    },
                });
            }

            const accessToken = TokenService.generateToken(tokenData, systemRole, "1d");
            const refreshToken = TokenService.generateToken(tokenData, systemRole, "90d");

            res.status(200).json({
                message: "New tokens generated successfully",
                data: {
                    accessToken,
                    refreshToken,
                },
            });
        } catch (error) {
            console.log(error);
            next({
                status: 500,
                message: "Internal Server Error",
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    details: "Unexpected error during token refresh",
                },
            });
            return;
        }
    }

}


export default AuthController;