import Joi from 'joi';

export const mealValidator = Joi.object({
    chefId: Joi.string().required(),
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional().allow(''),
    price: Joi.number().precision(2).positive().required(),
    photoUrl: Joi.string().uri().optional().allow(''),
    category: Joi.string().required(),
    preparationTime: Joi.string().pattern(/^\d+\s*(min|hr)$/).required(), // e.g., "30 min" or "1 hr"
    isAvailable: Joi.boolean().default(true),
});