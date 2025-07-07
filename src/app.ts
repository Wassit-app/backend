import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import Redis from 'ioredis';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import cookieParser from 'cookie-parser';
import AppRoutes from './routes/v1/router';
import passport from 'passport';
import logger from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { applyGraphQL } from './graphql';

const app = express();

const redisClient = new Redis(process.env.REDIS_URL as string);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());
app.use(helmet());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${req.body}`);
  next();
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 100, // 10 requests per minute
  duration: 60, // per minute
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip as string)
    .then(() => {
      next();
    })
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).send('Too Many Requests');
    });
});

// Apply GraphQL endpoint
applyGraphQL(app, redisClient);

// Routes
app.use(
  '/api/v1',
  (req: Request, res: Response, next: NextFunction) => {
    req.RedisClient = redisClient;
    next();
  },
  AppRoutes,
);

app.use(errorHandler);
// Global error handler (should be after routes)
// app.use(errorHandler);

export default app;
