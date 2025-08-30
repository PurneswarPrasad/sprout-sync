import jwt, { SignOptions, Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env['JWT_SECRET'] || 'your-jwt-secret-key-change-in-production';
const JWT_EXPIRES_IN: SignOptions['expiresIn'] = (process.env['JWT_EXPIRES_IN'] as SignOptions['expiresIn']) || '7d';

export interface JWTPayload {
  userId: string;
  id: string; // Add id for backward compatibility
  email: string;
  name: string;
  avatarUrl?: string | null | undefined;
}

export const generateToken = (payload: JWTPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'sprout-sync',
    audience: 'sprout-sync-users',
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'sprout-sync',
      audience: 'sprout-sync-users',
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};
