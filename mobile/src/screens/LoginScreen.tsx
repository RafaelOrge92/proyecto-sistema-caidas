import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GlassScreen } from '../components/GlassScreen';
import { GlassCard } from '../components/GlassCard';
import { GlassBanner } from '../components/GlassBanner';
import { PrimaryButton } from '../components/PrimaryButton';
import { AnimatedReveal } from '../components/AnimatedReveal';
import { theme } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID
} from '../config/env';

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'login' | 'register';

const getAuthErrorMessage = (error: unknown, mode: AuthMode) => {
  if (error instanceof ApiError) {
    const apiMessage = typeof error.message === 'string' ? error.message.toLowerCase() : '';
    if (error.status === 401) {
      return mode === 'login' ? 'Credenciales incorrectas' : 'Registro creado, pero no se pudo iniciar sesion';
    }
    if (error.status === 400) {
      return 'Revisa los campos obligatorios';
    }
    if (error.status === 409 || apiMessage.includes('duplicate') || apiMessage.includes('unique')) {
      return 'Ya existe una cuenta con ese correo';
    }
    if (error.status >= 500) {
      return 'Error interno del backend';
    }
    return `Error de API (${error.status})`;
  }

  return 'No se pudo conectar con el backend (red)';
};

export const LoginScreen = () => {
  const { loginWithPassword, loginWithGoogle, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [googleRequest, , promptGoogleSignIn] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    selectAccount: true
  });

  const isRegisterMode = mode === 'register';

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      if (isRegisterMode) {
        await register({
          email: trimmedEmail,
          fullName: fullName.trim(),
          password
        });
      } else {
        await loginWithPassword(trimmedEmail, password);
      }
    } catch (e) {
      setError(getAuthErrorMessage(e, mode));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);

    if (!googleRequest) {
      setError('Google login no configurado. Revisa los client IDs en .env');
      return;
    }

    setGoogleLoading(true);
    try {
      const result = await promptGoogleSignIn();

      if (result.type !== 'success') {
        if (result.type !== 'cancel' && result.type !== 'dismiss') {
          setError('No se pudo completar el login con Google');
        }
        return;
      }

      const googleIdToken = result.params.id_token;
      if (!googleIdToken) {
        setError('Google no devolvio id_token');
        return;
      }

      await loginWithGoogle(googleIdToken);
    } catch (e) {
      setError(getAuthErrorMessage(e, 'login'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <GlassScreen scroll contentContainerStyle={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AnimatedReveal>
          <GlassCard style={styles.card}>
            <LinearGradient colors={theme.gradients.primary} style={styles.header}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name="shield-alert" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>FallGuard Mobile</Text>
              <Text style={styles.subtitle}>Centro de deteccion y respuesta ante caidas</Text>
            </LinearGradient>

            <View style={styles.form}>
              <View style={styles.modeSwitchRow}>
                <Pressable
                  onPress={() => {
                    setMode('login');
                    setError(null);
                  }}
                  style={[styles.modeSwitchItem, !isRegisterMode && styles.modeSwitchItemActive]}
                >
                  <Text style={[styles.modeSwitchText, !isRegisterMode && styles.modeSwitchTextActive]}>Iniciar sesion</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setMode('register');
                    setError(null);
                  }}
                  style={[styles.modeSwitchItem, isRegisterMode && styles.modeSwitchItemActive]}
                >
                  <Text style={[styles.modeSwitchText, isRegisterMode && styles.modeSwitchTextActive]}>Registrarse</Text>
                </Pressable>
              </View>

              {isRegisterMode ? (
                <View style={styles.field}>
                  <Text style={styles.label}>Nombre completo</Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Nombre y apellidos"
                    placeholderTextColor={theme.colors.textSecondary}
                    autoCapitalize="words"
                    autoComplete="name"
                    style={styles.input}
                  />
                </View>
              ) : null}

              <View style={styles.field}>
                <Text style={styles.label}>Correo electronico</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Contrasena</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="********"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                  onSubmitEditing={handleSubmit}
                  style={styles.input}
                />
              </View>

              {error ? <GlassBanner message={error} /> : null}

              <PrimaryButton
                title={loading ? 'Verificando...' : isRegisterMode ? 'Crear cuenta' : 'Iniciar sesion'}
                onPress={handleSubmit}
                variant="primary"
                style={styles.submit}
                disabled={loading || googleLoading || !email.trim() || !password || (isRegisterMode && !fullName.trim())}
              />

              <Pressable
                onPress={handleGoogleLogin}
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && !googleLoading && styles.googleButtonPressed,
                  (!googleRequest || loading || googleLoading) && styles.googleButtonDisabled
                ]}
                disabled={!googleRequest || loading || googleLoading}
              >
                <MaterialCommunityIcons name="google" size={18} color={theme.colors.textPrimary} />
                <Text style={styles.googleButtonText}>Continuar con Google</Text>
                {googleLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
              </Pressable>

              {loading ? <ActivityIndicator color={theme.colors.primary} /> : null}
            </View>
          </GlassCard>
        </AnimatedReveal>

        <AnimatedReveal delay={150}>
          <Text style={styles.footer}>Supervision clinica en tiempo real</Text>
        </AnimatedReveal>
      </KeyboardAvoidingView>
    </GlassScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    justifyContent: 'center'
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderColor: theme.colors.borderStrong
  },
  header: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)'
  },
  title: {
    fontFamily: theme.typography.family.semibold,
    fontSize: theme.typography.size.xl,
    color: theme.colors.textPrimary
  },
  subtitle: {
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm,
    color: '#E0E7FF',
    textAlign: 'center'
  },
  form: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md
  },
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 4,
    gap: 6
  },
  modeSwitchItem: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modeSwitchItemActive: {
    backgroundColor: 'rgba(255,255,255,0.14)'
  },
  modeSwitchText: {
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary
  },
  modeSwitchTextActive: {
    color: theme.colors.textPrimary
  },
  field: {
    gap: 8
  },
  label: {
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary
  },
  input: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.family.medium
  },
  submit: {
    marginTop: theme.spacing.sm
  },
  googleButton: {
    marginTop: theme.spacing.sm,
    minHeight: 52,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm
  },
  googleButtonPressed: {
    transform: [{ scale: 0.985 }]
  },
  googleButtonDisabled: {
    opacity: 0.6
  },
  googleButtonText: {
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textPrimary
  },
  footer: {
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.family.medium
  }
});
