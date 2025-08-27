"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationLogResponseSchema = exports.createNotificationLogSchema = exports.channelEnum = void 0;
const zod_1 = require("zod");
exports.channelEnum = zod_1.z.enum(['WEB_PUSH']);
exports.createNotificationLogSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
    payloadJson: zod_1.z.record(zod_1.z.any()),
    sentAt: zod_1.z.string().datetime('Invalid sent date'),
    channel: exports.channelEnum,
});
exports.notificationLogResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    payloadJson: zod_1.z.string(),
    sentAt: zod_1.z.date(),
    channel: exports.channelEnum,
});
//# sourceMappingURL=notificationLog.js.map