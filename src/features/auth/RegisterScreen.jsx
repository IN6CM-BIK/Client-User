import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Landmark, ArrowLeft, Check } from 'lucide-react-native';
import { useAuthStore } from './store/authStore';
import { COLORS } from '../../shared/constants/colors';
import AlertMessage from '../../shared/components/AlertMessage';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    dpi: '',
    fechaNacimiento: '1995-05-15', // Valor predeterminado para simplicidad
    telefono: '',
    email: '',
    password: '',
    departamento: 'Guatemala',
    municipio: 'Guatemala',
    zona: '10',
    detalle: 'Calle Real Zona 10',
    fotoDpiAdelanteUrl: 'https://bik.com/uploads/cliente_front.png',
    fotoDpiAtrasUrl: 'https://bik.com/uploads/cliente_back.png',
    fotoRostroUrl: 'https://bik.com/uploads/cliente_face.png',
    ingresosMensuales: '5000',
  });

  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const handleRegister = async () => {
    // Validaciones básicas
    if (!form.nombres || !form.apellidos || !form.dpi || !form.telefono || !form.email || !form.password) {
      Alert.alert('Campos Incompletos', 'Por favor complete todos los campos obligatorios.');
      return;
    }

    if (form.dpi.length !== 13) {
      Alert.alert('DPI Inválido', 'El DPI debe tener exactamente 13 dígitos numéricos.');
      return;
    }

    try {
      const payload = {
        nombres: form.nombres,
        apellidos: form.apellidos,
        dpi: form.dpi,
        fechaNacimiento: new Date(form.fechaNacimiento),
        telefono: form.telefono,
        email: form.email,
        password: form.password,
        direccion: {
          departamento: form.departamento,
          municipio: form.municipio,
          zona: form.zona,
          detalle: form.detalle
        },
        fotoDpiAdelanteUrl: form.fotoDpiAdelanteUrl,
        fotoDpiAtrasUrl: form.fotoDpiAtrasUrl,
        fotoRostroUrl: form.fotoRostroUrl,
        ingresosMensuales: parseFloat(form.ingresosMensuales),
        rol: 'Cliente'
      };

      await register(payload);
      
      Alert.alert(
        'Registro Exitoso',
        'Tu cuenta ha sido creada y se encuentra en proceso de verificación por la administración.',
        [{ text: 'Entendido', onPress: () => navigation.navigate('Login') }]
      );
    } catch (e) {
      // El store ya almacena el error en state.error
    }
  };

  const updateField = (key, value) => {
    setForm({ ...form, [key]: value });
    if (error) clearError();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Crear Cuenta</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Datos Personales</Text>
          
          {error && <AlertMessage message={error} />}

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Nombres *</Text>
              <TextInput
                style={styles.input}
                value={form.nombres}
                onChangeText={(t) => updateField('nombres', t)}
                placeholder="Juan"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.label}>Apellidos *</Text>
              <TextInput
                style={styles.input}
                value={form.apellidos}
                onChangeText={(t) => updateField('apellidos', t)}
                placeholder="Pérez"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Documento Personal de Identificación (DPI) *</Text>
            <TextInput
              style={styles.input}
              value={form.dpi}
              onChangeText={(t) => updateField('dpi', t)}
              placeholder="3333444455556"
              keyboardType="number-pad"
              maxLength={13}
            />
          </View>

          <Text style={styles.sectionTitle}>Contacto y Acceso</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo Electrónico *</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(t) => updateField('email', t)}
              placeholder="juan.perez@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Número de Teléfono *</Text>
            <TextInput
              style={styles.input}
              value={form.telefono}
              onChangeText={(t) => updateField('telefono', t)}
              placeholder="55554444"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña *</Text>
            <TextInput
              style={styles.input}
              value={form.password}
              onChangeText={(t) => updateField('password', t)}
              placeholder="Min. 8 caracteres"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ingresos Mensuales Estimados (Q) *</Text>
            <TextInput
              style={styles.input}
              value={form.ingresosMensuales}
              onChangeText={(t) => updateField('ingresosMensuales', t)}
              placeholder="5000"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Registrando...' : 'Registrarme'}</Text>
            {!loading && <Check size={20} color={COLORS.white} style={styles.btnIcon} />}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    height: Platform.OS === 'ios' ? 88 : 64,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#F3F4F6',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 6,
  },
  input: {
    height: 44,
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.black,
  },
  button: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: COLORS.mediumGray,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnIcon: {
    marginLeft: 8,
  },
});
