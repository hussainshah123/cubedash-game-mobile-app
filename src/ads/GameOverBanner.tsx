import React, { useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  useForeground,
} from 'react-native-google-mobile-ads';
import { GAME_OVER_BANNER_UNIT_ID } from './adUnits';

export default function GameOverBanner() {
  const bannerRef = useRef<BannerAd>(null);

  useForeground(() => {
    if (Platform.OS === 'ios') {
      bannerRef.current?.load();
    }
  });

  return (
    <View style={styles.wrap}>
      <BannerAd
        ref={bannerRef}
        unitId={GAME_OVER_BANNER_UNIT_ID}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    alignItems: 'center',
  },
});
