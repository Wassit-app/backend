import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

declare global {
  namespace Express {
    interface User {
      id: string;
      role?: string;
    }
    interface Request {
      user?: User;
      RedisClient: Redis
    }
  }
}

export const isChef = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'CHEF') {
    res.status(403).json({ message: 'Access denied: Chef role required' });
    return;
  }
  next();
};