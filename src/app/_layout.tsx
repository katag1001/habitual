import { Quicksand_500Medium, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { Shrikhand_400Regular } from '@expo-google-fonts/shrikhand';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { HabitsProvider, useHabits } from '@/store/HabitsContext';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Shrikhand_400Regular, Quicksand_500Medium, Quicksand_700Bold });

  if (!fontsLoaded && !fontError) return null;
  return (
    <HabitsProvider>
      <AppStack />
    </HabitsProvider>
  );
}

function AppStack() {
  const { ready } = useHabits();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}
