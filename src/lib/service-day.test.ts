import { describe, expect, it } from 'vitest';

import { getCurrentServiceDayStart, isInCurrentServiceDay } from './service-day';

describe('service day boundary', () => {
  it('uses today at 05:00 JST after the reset time', () => {
    const now = new Date('2026-07-29T12:00:00+09:00');
    expect(new Date(getCurrentServiceDayStart(now)).toISOString()).toBe('2026-07-28T20:00:00.000Z');
  });

  it('uses the previous day at 05:00 JST before the reset time', () => {
    const now = new Date('2026-07-29T04:59:59+09:00');
    expect(new Date(getCurrentServiceDayStart(now)).toISOString()).toBe('2026-07-27T20:00:00.000Z');
  });

  it('hides orders from before the current service day', () => {
    const now = new Date('2026-07-29T06:00:00+09:00');
    expect(isInCurrentServiceDay('2026-07-29T05:00:00+09:00', now)).toBe(true);
    expect(isInCurrentServiceDay('2026-07-29T04:59:59+09:00', now)).toBe(false);
  });
});
