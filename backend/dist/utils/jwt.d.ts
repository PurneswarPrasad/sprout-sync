export interface JWTPayload {
    userId: string;
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null | undefined;
    username?: string | null | undefined;
    isNewUser?: boolean;
}
export declare const generateToken: (payload: JWTPayload) => string;
export declare const verifyToken: (token: string) => JWTPayload;
export declare const decodeToken: (token: string) => JWTPayload | null;
//# sourceMappingURL=jwt.d.ts.map