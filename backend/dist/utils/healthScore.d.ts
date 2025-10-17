import { PlantTask } from '@prisma/client';
export declare function calculateHealthScore(tasks: PlantTask[]): number;
export declare function calculateCareStreak(tasks: PlantTask[], createdAt: Date): number;
export declare function getBadgeTier(streak: number): {
    name: string;
    quote: string;
    image: string;
};
//# sourceMappingURL=healthScore.d.ts.map