import Joi from 'joi';

export const OrderSchema = Joi.object({
  mealId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  status: Joi.string()
    .valid('PENDING', 'PREPARING', 'READY', 'delivered', 'cancelled')
    .default('PENDING'),
  deliveryType: Joi.string().valid('PICKUP', 'DELIVERY').required(),
  deliveryAddress: Joi.string().required(),
  specialInstructions: Joi.string().allow('', null),
  paymentStatus: Joi.boolean().default(false),
  paymentMethod: Joi.string().valid('CASH', 'CARD', 'CHARGILY').required(),
});
