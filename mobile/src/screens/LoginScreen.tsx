import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
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

export const LoginScreen = () => {
  const { loginWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithPassword(email.trim(), password);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          setError('Credenciales incorrectas');
        } else if (e.status >= 500) {
          setError('Error interno del backend');
        } else {
          setError(`Error de API (${e.status})`);
        }
      } else {
        setError('No se pudo conectar con el backend (red)');
      }
    } finally {
      setLoading(false);
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
                title={loading ? 'Verificando...' : 'Iniciar sesion'}
                onPress={handleSubmit}
                variant="primary"
                style={styles.submit}
                disabled={loading || !email.trim() || !password}
              />

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
  footer: {
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.family.medium
  }
});
