import Joi from "joi";

export const ProfileValidator = Joi.object({
  username: Joi.string(),
  fullName: Joi.string(),
  email: Joi.string().email().allow(null),
  phone: Joi.string().allow(null),
  password: Joi.string(),
  oauthProvider: Joi.string().allow(null),
  oauthId: Joi.string().allow(null),
  role: Joi.string().valid('CUSTOMER', 'CHEF'),
  deliveryAddress: Joi.string().allow(null),
  latitude: Joi.number().allow(null),
  longitude: Joi.number().allow(null),
  favoriteMeals: Joi.array().items(Joi.string()),
  recentOrders: Joi.array().items(Joi.string()),
  reviews: Joi.array().items(Joi.object()),
});

