import Joi from "joi";

const baseSchema = Joi.object({
  username: Joi.string(),
  fullName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().optional(),
  role: Joi.string().valid("customer", "chef").required(),

  // Common fields
  address: Joi.string().optional(), // used for both roles but named differently
  otp: Joi.string().optional(),
  otpExpireAt: Joi.date().optional(),
});

// Chef-specific schema
const chefSchema = Joi.object({
  bio: Joi.string(),
  avgReviewScore: Joi.number().optional(),
  totalReviews: Joi.number().optional(),
  certification: Joi.string(),
}).when(Joi.object({ role: Joi.string().valid("chef") }).unknown(), {
  then: Joi.required(),
});

// Customer-specific schema
const customerSchema = Joi.object({
  deliveryAddress: Joi.string(),
}).when(Joi.object({ role: Joi.string().valid("customer") }).unknown(), {
  then: Joi.required(),
});

export const validateRegistrationSchema = Joi.object({
    userId: Joi.string().required(),
    otp: Joi.string().length(4).required(),
}).required()

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid("customer", "chef").required(),
  password: Joi.string().min(6).required(),
})

export const resetPasswordRequestSchema = Joi.object({
    email: Joi.string().email().required(),
}).required()

export const confirmResetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(4).required(),
});

// Final schema
export const registrationSchema = baseSchema.concat(chefSchema).concat(customerSchema);
