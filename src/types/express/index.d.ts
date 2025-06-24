// This file extends the Express Request interface to include a user object
export {};

declare global {
  namespace Express {
    interface IUser {
      id: string;
      email: string;
      role: 'CUSTOMER' | 'CHEF';
    }
    interface Request {
      user?: IUser;
    }
  }
}

