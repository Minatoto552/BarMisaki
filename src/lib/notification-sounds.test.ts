import { beforeEach, describe, expect, it, vi } from 'vitest';

const starts: number[] = [];

class FakeAudioContext {
  state: AudioContextState = 'running';
  currentTime = 1;
  destination = {} as AudioDestinationNode;
  resume = vi.fn(async () => undefined);
  createOscillator = () => ({
    type: 'sine',
    frequency: { setValueAtTime: vi.fn() },
    connect() { return this; },
    start: (at: number) => starts.push(at),
    stop: vi.fn(),
  }) as unknown as OscillatorNode;
  createGain = () => ({
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect() { return this; },
  }) as unknown as GainNode;
}

describe('notification sounds', () => {
  beforeEach(() => {
    starts.length = 0;
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  it('お知らせと緊急で異なる音列を再生する', async () => {
    const sounds = await import('./notification-sounds');
    const cleanup = sounds.installNotificationSoundUnlock();
    window.dispatchEvent(new Event('pointerdown'));
    await Promise.resolve();

    sounds.playAnnouncementSound();
    expect(starts).toHaveLength(3);
    sounds.playEmergencySound();
    expect(starts).toHaveLength(9);
    cleanup();
  });
});
