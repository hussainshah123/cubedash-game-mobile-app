import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProgressProvider } from './src/store/ProgressContext';
import type { RootStackParamList } from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import LevelsScreen from './src/screens/LevelsScreen';
import SkinsScreen from './src/screens/SkinsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0b1026',
  },
};

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProgressProvider>
          <StatusBar
            barStyle="light-content"
            translucent
            backgroundColor="transparent"
          />
          <NavigationContainer theme={navTheme}>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                animationDuration: 220,
              }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Levels" component={LevelsScreen} />
              <Stack.Screen name="Skins" component={SkinsScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen
                name="Game"
                component={GameScreen}
                options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </ProgressProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
