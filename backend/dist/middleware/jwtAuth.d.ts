import { Request, Response, NextFunction } from 'express';
export declare const authenticateJWT: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=jwtAuth.d.ts.map