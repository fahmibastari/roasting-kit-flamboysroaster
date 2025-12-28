// apps/mobile/src/navigation/AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import RoastingTimerScreen from '../screens/RoastingTimerScreen';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor={COLORS.background} />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.surface,
            elevation: 0, // Android shadow
            shadowOpacity: 0, // iOS shadow
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: COLORS.textPrimary,
            fontSize: 18,
          },
          cardStyle: { backgroundColor: COLORS.background }, // Global Screen Background
        }}
      >
        {/* Halaman Login (Tanpa Header) */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        {/* Halaman Utama */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Dashboard',
            headerLeft: () => null, // Disable hardware back button handling might be needed too in logic
            headerTitleAlign: 'center'
          }}
        />

        {/* Halaman Timer */}
        <Stack.Screen
          name="Timer"
          component={RoastingTimerScreen}
          options={{
            title: 'Roasting Timer',
            headerBackTitle: 'Back',
            headerTintColor: COLORS.primary
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}