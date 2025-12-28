import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Image } from 'react-native';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const jsonValue = await SecureStore.getItemAsync('user_session');
        if (jsonValue != null) {
          const user = JSON.parse(jsonValue);
          navigation.replace('Home', {
            roasterId: user.id,
            roasterName: user.fullName
          });
        }
      } catch (e) {
        // error reading value
      } finally {
        setCheckingAuth(false);
      }
    }
    checkLogin();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) return Alert.alert("Missing Input", "Please enter both username and password.");

    setLoading(true);
    try {
      const res = await api.post('/users/login', { username, password });
      const response = res.data;
      const user = response.user;

      await SecureStore.setItemAsync('user_session', JSON.stringify(user));
      await SecureStore.setItemAsync('user_token', response.access_token);

      navigation.replace('Home', {
        roasterId: user.id,
        roasterName: user.fullName
      });

    } catch (error: any) {
      console.log("LOGIN ERROR:", error.message);
      Alert.alert("Login Failed", "Invalid credentials or network error.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>FLAMBOYS</Text>
          <Text style={styles.subtitle}>ROASTER</Text>
        </View>

        <Text style={styles.instruction}>Sign in to start roasting</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.textInverse} />
          ) : (
            <Text style={styles.btnText}>LOGIN</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: SPACING.lg
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: 24,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 2
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 4,
    marginTop: -4
  },
  instruction: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl
  },
  input: {
    backgroundColor: COLORS.surfaceHighlight,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    fontSize: 16
  },
  btn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    color: COLORS.textInverse,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1
  }
});