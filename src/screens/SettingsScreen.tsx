import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import MenuBackground from '../components/MenuBackground';
import Btn from '../components/Btn';
import { useProgress } from '../store/ProgressContext';
import { UI } from '../theme/themes';
import { SoundManager } from '../audio/SoundManager';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { soundOn, setSoundOn, resetProgress } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <View style={styles.root}>
      <MenuBackground />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          hitSlop={12}
          onPress={() => {
            SoundManager.play('click');
            navigation.goBack();
          }}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>SETTINGS</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>🔊  Sound Effects</Text>
          <Switch
            value={soundOn}
            onValueChange={v => {
              setSoundOn(v);
              if (v) SoundManager.play('click');
            }}
            trackColor={{ false: '#2a2f55', true: UI.accentAlt }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.divider} />

        {confirmReset ? (
          <View style={styles.resetConfirm}>
            <Text style={styles.resetWarn}>
              Delete all progress, coins and skins?
            </Text>
            <View style={styles.resetRow}>
              <Btn
                label="YES, RESET"
                variant="danger"
                small
                onPress={() => {
                  resetProgress();
                  setConfirmReset(false);
                }}
              />
              <Btn
                label="CANCEL"
                variant="secondary"
                small
                onPress={() => setConfirmReset(false)}
              />
            </View>
          </View>
        ) : (
          <Btn
            label="🗑  RESET PROGRESS"
            variant="secondary"
            onPress={() => setConfirmReset(true)}
          />
        )}

        <Text style={styles.about}>
          CUBE DASH · v1.0{'\n'}Built with React Native Skia + Reanimated
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: UI.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: -3,
  },
  title: {
    color: UI.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: UI.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: UI.cardBorder,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rowLabel: {
    color: UI.text,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#ffffff12',
  },
  resetConfirm: {
    backgroundColor: UI.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: UI.danger,
    padding: 18,
    gap: 14,
    alignItems: 'center',
  },
  resetWarn: {
    color: UI.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  resetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  about: {
    color: UI.textDim,
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 20,
    marginTop: 30,
  },
});
