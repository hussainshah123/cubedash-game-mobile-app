import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import MenuBackground from '../components/MenuBackground';
import CubePreview from '../components/CubePreview';
import { useProgress } from '../store/ProgressContext';
import { SKINS } from '../game/skins';
import { UI } from '../theme/themes';
import { SoundManager } from '../audio/SoundManager';

type Props = NativeStackScreenProps<RootStackParamList, 'Skins'>;

export default function SkinsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { coins, unlockedSkins, selectedSkin, buySkin } = useProgress();

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
        <Text style={styles.title}>SKINS</Text>
        <View style={styles.coinPill}>
          <View style={styles.coinIcon} />
          <Text style={styles.coinCount}>{coins}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {SKINS.map(skin => {
            const owned = unlockedSkins.includes(skin.id);
            const selected = selectedSkin === skin.id;
            const affordable = coins >= skin.cost;
            return (
              <Pressable
                key={skin.id}
                onPress={() => {
                  const ok = buySkin(skin.id);
                  SoundManager.play(ok && !owned ? 'coin' : 'click');
                }}
                style={({ pressed }) => [
                  styles.card,
                  selected && styles.cardSelected,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <View style={!owned && !affordable ? styles.dim : null}>
                  <CubePreview skin={skin} size={72} />
                </View>
                <Text style={styles.skinName}>
                  {skin.emoji} {skin.name}
                </Text>
                {selected ? (
                  <View style={[styles.tag, styles.tagSelected]}>
                    <Text style={styles.tagText}>EQUIPPED</Text>
                  </View>
                ) : owned ? (
                  <View style={[styles.tag, styles.tagOwned]}>
                    <Text style={styles.tagText}>OWNED</Text>
                  </View>
                ) : (
                  <View style={[styles.tag, styles.tagCost]}>
                    <View style={styles.coinIconSmall} />
                    <Text
                      style={[
                        styles.tagText,
                        !affordable && styles.tagTextDim,
                      ]}
                    >
                      {skin.cost}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>
          Collect coins in levels to unlock new skins
        </Text>
      </ScrollView>
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
    flex: 1,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#ffffff14',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  coinIcon: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: UI.gold,
    borderWidth: 2.5,
    borderColor: '#ffe9a8',
  },
  coinIconSmall: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: UI.gold,
    borderWidth: 2,
    borderColor: '#ffe9a8',
  },
  coinCount: {
    color: UI.text,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
    paddingTop: 8,
  },
  card: {
    width: 150,
    backgroundColor: UI.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: UI.cardBorder,
    alignItems: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  cardSelected: {
    borderColor: UI.accentAlt,
    borderWidth: 2,
  },
  dim: {
    opacity: 0.45,
  },
  skinName: {
    color: UI.text,
    fontWeight: '800',
    fontSize: 14,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagSelected: {
    backgroundColor: '#00e0b026',
  },
  tagOwned: {
    backgroundColor: '#ffffff14',
  },
  tagCost: {
    backgroundColor: '#ffcf4d1f',
  },
  tagText: {
    color: UI.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tagTextDim: {
    color: UI.textDim,
  },
  hint: {
    color: UI.textDim,
    textAlign: 'center',
    marginTop: 24,
    fontSize: 13,
  },
});
