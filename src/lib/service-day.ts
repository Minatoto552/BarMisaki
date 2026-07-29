const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Returns the UTC timestamp for the latest 05:00 in Japan. */
export const getCurrentServiceDayStart = (now = new Date()): number => {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  let boundaryAsUtc = Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate(), 5);
  if (jst.getUTCHours() < 5) boundaryAsUtc -= DAY_MS;
  return boundaryAsUtc - JST_OFFSET_MS;
};

export const isInCurrentServiceDay = (createdAt: string, now = new Date()): boolean => {
  const timestamp = new Date(createdAt).getTime();
  return Number.isFinite(timestamp) && timestamp >= getCurrentServiceDayStart(now);
};
