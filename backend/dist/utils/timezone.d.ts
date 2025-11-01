export declare const DEFAULT_TIMEZONE: string;
export declare const normalizeTimezone: (timezone?: string | null) => string;
export declare const resolveUserTimezone: (userId: string, preferredTimezone?: string | string[] | null) => Promise<string>;
export declare const startOfDayInTimezone: (timezone: string, baseDate?: Date) => Date;
export declare const startOfDayPlusDaysInTimezone: (timezone: string, days: number, baseDate?: Date) => Date;
//# sourceMappingURL=timezone.d.ts.map