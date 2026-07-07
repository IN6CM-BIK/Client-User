import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Landmark, User, Lock, ArrowRight } from 'lucide-react-native';
import { useAuthStore } from './store/authStore';
import { COLORS } from '../../shared/constants/colors';
import AlertMessage from '../../shared/components/AlertMessage';

export default function LoginScreen({ navigation }) {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const handleLogin = async () => {
    if (!identificador || !password) return;
    const role = await login(identificador, password);
    if (role && role !== 'Cliente') {
      // El store ya maneja la denegación si no es cliente, pero mostramos advertencia adicional por seguridad.
      useAuthStore.getState().logout();
    }
  };

  const handleTextChange = (setter) => (text) => {
    setter(text);
    if (error) clearError();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Landmark size={40} color={COLORS.white} />
          </View>
          <Text style={styles.brand}>BIK BANCO</Text>
          <Text style={styles.tagline}>Banco Informático Kinal</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>Ingresa tus credenciales para acceder a tu banca móvil</Text>

          {error && <AlertMessage message={error} />}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>DPI, Correo o Teléfono</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color={COLORS.mediumGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ej. cliente@bik.com"
                value={identificador}
                onChangeText={handleTextChange(setIdentificador)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={COLORS.mediumGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={handleTextChange(setPassword)}
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, (!identificador || !password || loading) && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={!identificador || !password || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Autenticando...' : 'Iniciar Sesión'}
            </Text>
            {!loading && <ArrowRight size={20} color={COLORS.white} style={styles.btnIcon} />}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Aún no tienes cuenta en BIK?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}> Regístrate aquí</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B3660', // Deep Admin Dark
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  brand: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#93C5FD',
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: COLORS.black,
    fontSize: 15,
  },
  button: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: COLORS.mediumGray,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnIcon: {
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#93C5FD',
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
