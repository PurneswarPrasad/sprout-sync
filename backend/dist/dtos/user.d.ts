import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    googleId: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    avatarUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string | undefined;
}, {
    googleId: string;
    email: string;
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
    name: string | null;
    avatarUrl: string | null;
    createdAt: Date;
}, {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    createdAt: Date;
}>;
export type UserResponseDTO = z.infer<typeof userResponseSchema>;
//# sourceMappingURL=user.d.ts.map