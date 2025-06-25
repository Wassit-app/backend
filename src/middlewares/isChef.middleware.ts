import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      role?: string;
    }
    interface Request {
      user?: User;
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