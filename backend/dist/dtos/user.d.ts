import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    googleId: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    avatarUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    googleId: string;
    name: string;
    avatarUrl?: string | undefined;
}, {
    email: string;
    googleId: string;
    name: string;
    avatarUrl?: string | undefined;
}>;
export type CreateUserDTO = z.infer<typeof createUserSchema>;
export declare const userResponseSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    avatarUrl: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    createdAt: Date;
    name: string | null;
    avatarUrl: string | null;
}, {
    id: string;
    email: string;
    createdAt: Date;
    name: string | null;
    avatarUrl: string | null;
}>;
export type UserResponseDTO = z.infer<typeof userResponseSchema>;
//# sourceMappingURL=user.d.ts.map