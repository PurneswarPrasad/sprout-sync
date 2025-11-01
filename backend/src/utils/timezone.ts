import { DateTime } from 'luxon';

import { prisma } from '../lib/prisma';

const SERVER_TIMEZONE = DateTime.local().zoneName || 'UTC';

export const DEFAULT_TIMEZONE = SERVER_TIMEZONE;

const tryNormalizeTimezone = (timezone?: string | null): string | null => {
  if (!timezone) {
    return null;
  }

  const normalized = timezone.trim();
  if (normalized.length === 0) {
    return null;
  }

  const probe = DateTime.now().setZone(normalized);
  if (!probe.isValid) {
    console.warn(`Invalid timezone "${normalized}" provided. Falling back to ${DEFAULT_TIMEZONE}.`);
    return null;
  }

  return normalized;
};

export const normalizeTimezone = (timezone?: string | null): string => {
  return tryNormalizeTimezone(timezone) ?? DEFAULT_TIMEZONE;
};

const shouldOverwriteStoredTimezone = (stored?: string | null): boolean => {
  if (!stored) {
    return true;
  }

  const lowered = stored.trim().toLowerCase();
  return lowered === 'utc' || lowered === 'etc/utc' || lowered === 'gmt' || lowered === 'z';
};

export const resolveUserTimezone = async (
  userId: string,
  preferredTimezone?: string | string[] | null,
): Promise<string> => {
  const preferredCandidate = Array.isArray(preferredTimezone) ? preferredTimezone[0] : preferredTimezone;
  const normalizedPreferred = tryNormalizeTimezone(preferredCandidate);

  if (normalizedPreferred) {
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: { timezone: true },
    });

    if (!settings || shouldOverwriteStoredTimezone(settings.timezone) || settings.timezone !== normalizedPreferred) {
      await prisma.userSettings.upsert({
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

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { timezone: true },
  });

  const storedTimezone = tryNormalizeTimezone(settings?.timezone);
  if (storedTimezone) {
    return storedTimezone;
  }

  return DEFAULT_TIMEZONE;
};

export const startOfDayInTimezone = (timezone: string, baseDate: Date = new Date()): Date => {
  const zone = normalizeTimezone(timezone);

  return DateTime.fromJSDate(baseDate)
    .setZone(zone)
    .startOf('day')
    .toJSDate();
};

export const startOfDayPlusDaysInTimezone = (
  timezone: string,
  days: number,
  baseDate: Date = new Date(),
): Date => {
  const zone = normalizeTimezone(timezone);

  return DateTime.fromJSDate(baseDate)
    .setZone(zone)
    .startOf('day')
    .plus({ days })
    .toJSDate();
};
