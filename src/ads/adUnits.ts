import { TestIds } from 'react-native-google-mobile-ads';

// __DEV__ builds use Google's test creative to avoid invalid-traffic
// flags on the real AdMob account while developing.
export const BANNER_UNIT_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : 'ca-app-pub-4687548663016677/3631842959';

export const INTERSTITIAL_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-4687548663016677/9283352786';

// TODO: AdMob requires a separate ad unit for rewarded ads — banner and
// interstitial unit ids will not serve here. Replace with the real
// rewarded unit id from the AdMob console before publishing; using
// TestIds until then so the build never ships with an invalid id.
export const REWARDED_UNIT_ID = TestIds.REWARDED;
