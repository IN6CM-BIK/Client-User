import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Lock, Check, Key } from 'lucide-react-native';
import { bikApi } from '../../shared/api/axiosInstance';
import { COLORS } from '../../shared/constants/colors';
import AlertMessage from '../../shared/components/AlertMessage';

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Campos Incompletos', 'Por favor completa todos los campos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error de Coincidencia', 'La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Contraseña Débil', 'La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await bikApi.put('/profile/change-password', {
        currentPassword,
        newPassword
      });

      if (res.data.status === 'success') {
        Alert.alert(
          'Contraseña Actualizada',
          'Tu contraseña ha sido modificada con éxito. Usa tu nueva contraseña en tu próximo ingreso.',
          [{ text: 'Entendido', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <View style={styles.iconRow}>
          <Key size={32} color={COLORS.secondary} />
          <Text style={styles.title}>Modificar Acceso</Text>
        </View>
        <Text style={styles.desc}>
          Para resguardar tu cuenta, te sugerimos utilizar una combinación compleja de caracteres.
        </Text>

        {error && <AlertMessage message={error} />}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña Actual *</Text>
          <View style={styles.inputWrapper}>
            <Lock size={18} color={COLORS.mediumGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nueva Contraseña *</Text>
          <View style={styles.inputWrapper}>
            <Lock size={18} color={COLORS.mediumGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirmar Nueva Contraseña *</Text>
          <View style={styles.inputWrapper}>
            <Lock size={18} color={COLORS.mediumGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, (!currentPassword || !newPassword || !confirmPassword || loading) && styles.btnDisabled]}
          onPress={handleChangePassword}
          disabled={!currentPassword || !newPassword || !confirmPassword || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.btnText}>Actualizar Contraseña</Text>
              <Check size={18} color={COLORS.white} style={styles.btnIcon} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  desc: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 6,
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
    height: 44,
    color: COLORS.black,
    fontSize: 14,
  },
  btn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  btnDisabled: {
    backgroundColor: COLORS.mediumGray,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnIcon: {
    marginLeft: 8,
  },
});
