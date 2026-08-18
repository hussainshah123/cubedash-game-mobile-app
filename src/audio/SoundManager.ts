import { Platform } from 'react-native';
import Sound from 'react-native-sound';

export type SfxName =
  | 'jump'
  | 'coin'
  | 'explosion'
  | 'complete'
  | 'click'
  | 'star';

const FILES: Record<SfxName, string> = {
  jump: 'jump.wav',
  coin: 'coin.wav',
  explosion: 'explosion.wav',
  complete: 'complete.wav',
  click: 'click.wav',
  star: 'star.wav',
};

const VOLUMES: Record<SfxName, number> = {
  jump: 0.55,
  coin: 0.7,
  explosion: 0.9,
  complete: 0.85,
  click: 0.5,
  star: 0.7,
};

class SoundManagerImpl {
  private sounds = new Map<SfxName, Sound>();
  private loaded = false;
  enabled = true;

  init() {
    if (this.loaded) return;
    this.loaded = true;
    Sound.setCategory('Ambient', true);
    (Object.keys(FILES) as SfxName[]).forEach(name => {
      const file = FILES[name];
      const s =
        Platform.OS === 'ios'
          ? new Sound(file, Sound.MAIN_BUNDLE, err => {
              if (!err) s.setVolume(VOLUMES[name]);
            })
          : new Sound(file, err => {
              if (!err) s.setVolume(VOLUMES[name]);
            });
      this.sounds.set(name, s);
    });
  }

  play(name: SfxName) {
    if (!this.enabled) return;
    const s = this.sounds.get(name);
    if (!s || !s.isLoaded()) return;
    // rewind so rapid retriggers (coins) restart cleanly
    s.stop(() => s.play());
  }

  setEnabled(on: boolean) {
    this.enabled = on;
  }
}

export const SoundManager = new SoundManagerImpl();
