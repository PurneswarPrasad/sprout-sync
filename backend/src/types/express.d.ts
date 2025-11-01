import { JWTPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface User extends JWTPayload {
      googleId?: string;
      createdAt?: Date;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};

