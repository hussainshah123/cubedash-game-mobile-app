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
    // iOS only: picks the AVAudioSession category. On Android this same
    // call instead remaps every Sound's stream to STREAM_NOTIFICATION,
    // which goes silent whenever the device's notification volume is
    // muted — so it must stay off the Android code path entirely.
    if (Platform.OS === 'ios') {
      Sound.setCategory('Ambient', true);
    }
    (Object.keys(FILES) as SfxName[]).forEach(name => {
      const file = FILES[name];
      const onError = (err: unknown) => {
        if (!err) {
          s.setVolume(VOLUMES[name]);
        } else {
          console.warn(`[SoundManager] failed to load ${file}:`, err);
        }
      };
      // Android resolves bare filenames against res/raw by passing no
      // basePath — passing the callback there instead (as this used to)
      // makes the library treat the callback itself as the basePath,
      // corrupting the filename and silently failing to load every sound.
      const s =
        Platform.OS === 'ios'
          ? new Sound(file, Sound.MAIN_BUNDLE, onError)
          : new Sound(file, undefined, onError);
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
