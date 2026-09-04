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
    localStorage.removeItem('barmisaki-sound');
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  it('通知音オフなら、お知らせと緊急をどちらも再生しない', async () => {
    const sounds = await import('./notification-sounds');
    localStorage.setItem('barmisaki-sound', 'off');
    sounds.playAnnouncementSound();
    sounds.playEmergencySound();
    expect(starts).toHaveLength(0);
    localStorage.removeItem('barmisaki-sound');
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
