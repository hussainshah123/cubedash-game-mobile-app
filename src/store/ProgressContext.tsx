import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SoundManager } from '../audio/SoundManager';
import { SKINS } from '../game/skins';

export interface LevelResult {
  stars: number;
  best: number;
}

interface ProgressState {
  coins: number;
  unlockedSkins: string[];
  selectedSkin: string;
  levels: Record<number, LevelResult>;
  soundOn: boolean;
}

interface ProgressApi extends ProgressState {
  ready: boolean;
  maxUnlockedLevel: number;
  totalStars: number;
  addCoins: (n: number) => void;
  buySkin: (id: string) => boolean;
  selectSkin: (id: string) => void;
  reportRun: (level: number, score: number, stars: number) => void;
  setSoundOn: (on: boolean) => void;
  resetProgress: () => void;
}

const DEFAULT_STATE: ProgressState = {
  coins: 0,
  unlockedSkins: ['classic'],
  selectedSkin: 'classic',
  levels: {},
  soundOn: true,
};

const STORAGE_KEY = '@cubedash/progress-v1';

const ProgressContext = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    SoundManager.init();
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          const parsed = { ...DEFAULT_STATE, ...JSON.parse(raw) };
          setState(parsed);
          SoundManager.setEnabled(parsed.soundOn);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((next: ProgressState) => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    }, 150);
  }, []);

  const update = useCallback(
    (fn: (prev: ProgressState) => ProgressState) => {
      setState(prev => {
        const next = fn(prev);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const addCoins = useCallback(
    (n: number) => {
      if (n <= 0) return;
      update(prev => ({ ...prev, coins: prev.coins + n }));
    },
    [update],
  );

  const buySkin = useCallback(
    (id: string) => {
      const skin = SKINS.find(s => s.id === id);
      if (!skin) return false;
      let ok = false;
      update(prev => {
        if (prev.unlockedSkins.includes(id)) {
          ok = true;
          return { ...prev, selectedSkin: id };
        }
        if (prev.coins < skin.cost) return prev;
        ok = true;
        return {
          ...prev,
          coins: prev.coins - skin.cost,
          unlockedSkins: [...prev.unlockedSkins, id],
          selectedSkin: id,
        };
      });
      return ok;
    },
    [update],
  );

  const selectSkin = useCallback(
    (id: string) => {
      update(prev =>
        prev.unlockedSkins.includes(id) ? { ...prev, selectedSkin: id } : prev,
      );
    },
    [update],
  );

  const reportRun = useCallback(
    (level: number, score: number, stars: number) => {
      update(prev => {
        const cur = prev.levels[level];
        return {
          ...prev,
          levels: {
            ...prev.levels,
            [level]: {
              stars: Math.max(cur?.stars ?? 0, stars),
              best: Math.max(cur?.best ?? 0, score),
            },
          },
        };
      });
    },
    [update],
  );

  const setSoundOn = useCallback(
    (on: boolean) => {
      SoundManager.setEnabled(on);
      update(prev => ({ ...prev, soundOn: on }));
    },
    [update],
  );

  const resetProgress = useCallback(() => {
    SoundManager.setEnabled(true);
    update(() => DEFAULT_STATE);
  }, [update]);

  const value = useMemo<ProgressApi>(() => {
    let maxCompleted = 0;
    let totalStars = 0;
    Object.entries(state.levels).forEach(([lvl, r]) => {
      if (r.stars > 0) maxCompleted = Math.max(maxCompleted, Number(lvl));
      totalStars += r.stars;
    });
    return {
      ...state,
      ready,
      maxUnlockedLevel: maxCompleted + 1,
      totalStars,
      addCoins,
      buySkin,
      selectSkin,
      reportRun,
      setSoundOn,
      resetProgress,
    };
  }, [
    state,
    ready,
    addCoins,
    buySkin,
    selectSkin,
    reportRun,
    setSoundOn,
    resetProgress,
  ]);

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
