import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma'; // adjust path as needed
import TokenService from '../service/jwt';

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = TokenService.verifyToken(token);
    // Optionally, fetch user from DB to attach full user object
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    req.user = user; // Attach user to request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};