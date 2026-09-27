import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .required()
    .messages({
      'any.required': 'NODE_ENV is required',
      'any.only': 'NODE_ENV must be one of: development, production, test',
    }),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'log', 'debug', 'verbose')
    .default('log'),
  DATABASE_URL: Joi.string().uri().required().messages({
    'any.required': 'Invalid or missing DATABASE_URL',
    'string.empty': 'Invalid or missing DATABASE_URL',
    'string.uri': 'Invalid or missing DATABASE_URL',
  }),
  JWT_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_SECRET is required',
    'string.empty': 'JWT_SECRET is required',
  }),
  JWT_EXPIRATION: Joi.string().required().messages({
    'any.required': 'JWT_EXPIRATION is required',
  }),
  CPF_ENCRYPTION_KEY: Joi.string().length(32).required().messages({
    'any.required': 'CPF_ENCRYPTION_KEY is required',
    'string.length': 'CPF_ENCRYPTION_KEY must be exactly 32 characters',
  }),
  EMAIL_OTP_PROVIDER_KEY: Joi.string().required().messages({
    'any.required': 'EMAIL_OTP_PROVIDER_KEY is required',
  }),
});
