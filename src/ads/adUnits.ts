import { TestIds } from 'react-native-google-mobile-ads';

// __DEV__ builds use Google's test creative to avoid invalid-traffic
// flags on the real AdMob account while developing.
export const GAME_OVER_BANNER_UNIT_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : 'ca-app-pub-9318693466829633/3171514231';
