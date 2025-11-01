"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOfDayPlusDaysInTimezone = exports.startOfDayInTimezone = exports.resolveUserTimezone = exports.normalizeTimezone = exports.DEFAULT_TIMEZONE = void 0;
const luxon_1 = require("luxon");
const prisma_1 = require("../lib/prisma");
const SERVER_TIMEZONE = luxon_1.DateTime.local().zoneName || 'UTC';
exports.DEFAULT_TIMEZONE = SERVER_TIMEZONE;
const tryNormalizeTimezone = (timezone) => {
    if (!timezone) {
        return null;
    }
    const normalized = timezone.trim();
    if (normalized.length === 0) {
        return null;
    }
    const probe = luxon_1.DateTime.now().setZone(normalized);
    if (!probe.isValid) {
        console.warn(`Invalid timezone "${normalized}" provided. Falling back to ${exports.DEFAULT_TIMEZONE}.`);
        return null;
    }
    return normalized;
};
const normalizeTimezone = (timezone) => {
    return tryNormalizeTimezone(timezone) ?? exports.DEFAULT_TIMEZONE;
};
exports.normalizeTimezone = normalizeTimezone;
const shouldOverwriteStoredTimezone = (stored) => {
    if (!stored) {
        return true;
    }
    const lowered = stored.trim().toLowerCase();
    return lowered === 'utc' || lowered === 'etc/utc' || lowered === 'gmt' || lowered === 'z';
};
const resolveUserTimezone = async (userId, preferredTimezone) => {
    const preferredCandidate = Array.isArray(preferredTimezone) ? preferredTimezone[0] : preferredTimezone;
    const normalizedPreferred = tryNormalizeTimezone(preferredCandidate);
    if (normalizedPreferred) {
        const settings = await prisma_1.prisma.userSettings.findUnique({
            where: { userId },
            select: { timezone: true },
        });
        if (!settings || shouldOverwriteStoredTimezone(settings.timezone) || settings.timezone !== normalizedPreferred) {
            await prisma_1.prisma.userSettings.upsert({
                where: { userId },
                update: { timezone: normalizedPreferred },
                create: {
                    userId,
                    persona: 'PRIMARY',
                    timezone: normalizedPreferred,
                },
            });
        }
        return normalizedPreferred;
    }
    const settings = await prisma_1.prisma.userSettings.findUnique({
        where: { userId },
        select: { timezone: true },
    });
    const storedTimezone = tryNormalizeTimezone(settings?.timezone);
    if (storedTimezone) {
        return storedTimezone;
    }
    return exports.DEFAULT_TIMEZONE;
};
exports.resolveUserTimezone = resolveUserTimezone;
const startOfDayInTimezone = (timezone, baseDate = new Date()) => {
    const zone = (0, exports.normalizeTimezone)(timezone);
    return luxon_1.DateTime.fromJSDate(baseDate)
        .setZone(zone)
        .startOf('day')
        .toJSDate();
};
exports.startOfDayInTimezone = startOfDayInTimezone;
const startOfDayPlusDaysInTimezone = (timezone, days, baseDate = new Date()) => {
    const zone = (0, exports.normalizeTimezone)(timezone);
    return luxon_1.DateTime.fromJSDate(baseDate)
        .setZone(zone)
        .startOf('day')
        .plus({ days })
        .toJSDate();
};
exports.startOfDayPlusDaysInTimezone = startOfDayPlusDaysInTimezone;
//# sourceMappingURL=timezone.js.map