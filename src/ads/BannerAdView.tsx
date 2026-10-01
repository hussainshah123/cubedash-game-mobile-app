import React, { useRef } from 'react';
import { Platform, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  useForeground,
} from 'react-native-google-mobile-ads';
import { BANNER_UNIT_ID } from './adUnits';

interface Props {
  style?: StyleProp<ViewStyle>;
}

export default function BannerAdView({ style }: Props) {
  const bannerRef = useRef<BannerAd>(null);

  useForeground(() => {
    if (Platform.OS === 'ios') {
      bannerRef.current?.load();
    }
  });

  return (
    <View style={[styles.wrap, style]}>
      <BannerAd
        ref={bannerRef}
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
});
