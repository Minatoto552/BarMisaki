type SoundKind = 'emergency' | 'announcement';

let audioContext: AudioContext | null = null;
let soundReady = false;

const getAudioContext = () => {
  if (!audioContext) audioContext = new AudioContext();
  return audioContext;
};

const tone = (context: AudioContext, frequency: number, start: number, duration: number, volume: number, type: OscillatorType) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
};

const play = (kind: SoundKind) => {
  if (!soundReady) return;
  const context = getAudioContext();
  if (context.state !== 'running') return;
  const now = context.currentTime + 0.025;

  if (kind === 'emergency') {
    [0, 0.28, 0.56].forEach((offset) => {
      tone(context, 880, now + offset, 0.18, 0.18, 'square');
      tone(context, 660, now + offset + 0.09, 0.18, 0.13, 'square');
    });
    return;
  }

  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    tone(context, frequency, now + index * 0.11, 0.28, 0.1, 'sine');
  });
};

export const playEmergencySound = () => play('emergency');
export const playAnnouncementSound = () => play('announcement');

/** Browsers require one user gesture before notification audio can start. */
export const installNotificationSoundUnlock = () => {
  const removeListeners = () => {
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  const unlock = () => {
    const context = getAudioContext();
    void context.resume().then(() => {
      soundReady = context.state === 'running';
      if (soundReady) removeListeners();
    });
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchstart', unlock, { passive: true });
  return removeListeners;
};
