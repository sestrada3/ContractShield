import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import HomeScreen       from './src/screens/HomeScreen';
import ResultsScreen    from './src/screens/ResultsScreen';
import PaywallScreen    from './src/screens/PaywallScreen';
import AccountScreen    from './src/screens/AccountScreen';
import LoginScreen      from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { getSession, supabase } from './src/services/auth';
import { setAuthToken, getUsage } from './src/services/api';
import { useStore } from './src/services/store';

const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#0b0d12', card: '#13161e', border: 'rgba(255,255,255,0.07)' },
};

export default function App() {
  const { user, setUser, setIsPro, setUsage } = useStore();

  const syncUsage = async () => {
    try {
      const u = await getUsage();
      setIsPro(u.isPro);
      setUsage(u.used, u.limit);
    } catch {}
  };
  const [ready, setReady]               = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    const init = async () => {
      const [session, seen] = await Promise.all([
        getSession().catch(() => null),
        SecureStore.getItemAsync('onboarding_done').catch(() => null),
      ]);
      if (seen) setOnboardingDone(true);
      if (session) {
        setUser(session.user);
        setAuthToken(session.access_token);
        await syncUsage();
      }
      setReady(true);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser(session.user);
        setAuthToken(session.access_token);
        syncUsage();
      } else {
        setUser(null);
        setAuthToken(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0d12', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#c9a84c" size="large"/>
      </View>
    );
  }

  if (!onboardingDone) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light"/>
        <OnboardingScreen onDone={() => setOnboardingDone(true)}/>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={MyTheme}>
        <StatusBar style="light"/>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0b0d12' },
            animation: 'slide_from_right',
          }}
        >
          {!user ? (
            <Stack.Screen name="Login" component={LoginScreen}/>
          ) : (
            <>
              <Stack.Screen name="Home"    component={HomeScreen}/>
              <Stack.Screen name="Results" component={ResultsScreen}/>
              <Stack.Screen name="Paywall" component={PaywallScreen} options={{ animation: 'slide_from_bottom' }}/>
              <Stack.Screen name="Account" component={AccountScreen} options={{ animation: 'slide_from_right' }}/>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
