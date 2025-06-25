import { Request, Response, NextFunction } from 'express';

export const isCustomer = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'CUSTOMER') {
    res.status(403).json({ message: 'Access denied: Customer role required' });
    return;
  }
  next();
};