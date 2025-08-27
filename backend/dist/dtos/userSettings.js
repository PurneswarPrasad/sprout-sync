"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSettingsResponseSchema = exports.updateUserSettingsSchema = exports.personaEnum = void 0;
const zod_1 = require("zod");
exports.personaEnum = zod_1.z.enum(['PRIMARY', 'SECONDARY', 'TERTIARY']);
exports.updateUserSettingsSchema = zod_1.z.object({
    persona: exports.personaEnum,
    timezone: zod_1.z.string().min(1, 'Timezone is required'),
    onesignalPlayerId: zod_1.z.string().optional(),
});
exports.userSettingsResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    persona: exports.personaEnum,
    timezone: zod_1.z.string(),
    onesignalPlayerId: zod_1.z.string().nullable(),
});
//# sourceMappingURL=userSettings.js.map