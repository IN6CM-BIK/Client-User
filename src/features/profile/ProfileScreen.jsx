import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { User, Phone, Mail, Landmark, MapPin, DollarSign } from 'lucide-react-native';
import { useAuthStore } from '../auth/store/authStore';
import { bikApi } from '../../shared/api/axiosInstance';
import { COLORS } from '../../shared/constants/colors';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await bikApi.get('/profile');
      if (res.data.status === 'success') {
        setUser(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Identificación Personal</Text>
        
        <View style={styles.infoRow}>
          <User size={20} color={COLORS.primary} style={styles.icon} />
          <View>
            <Text style={styles.label}>Nombres y Apellidos</Text>
            <Text style={styles.value}>
              {user?.nombres} {user?.apellidos}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Landmark size={20} color={COLORS.primary} style={styles.icon} />
          <View>
            <Text style={styles.label}>DPI / CUI</Text>
            <Text style={styles.value}>{user?.dpi}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <User size={20} color={COLORS.primary} style={styles.icon} />
          <View>
            <Text style={styles.label}>Fecha de Nacimiento</Text>
            <Text style={styles.value}>
              {user?.fechaNacimiento ? new Date(user.fechaNacimiento).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Contacto y Finanzas</Text>

        <View style={styles.infoRow}>
          <Mail size={20} color={COLORS.primary} style={styles.icon} />
          <View>
            <Text style={styles.label}>Correo Electrónico</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Phone size={20} color={COLORS.primary} style={styles.icon} />
          <View>
            <Text style={styles.label}>Teléfono Móvil</Text>
            <Text style={styles.value}>{user?.telefono}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <DollarSign size={20} color={COLORS.primary} style={styles.icon} />
          <View>
            <Text style={styles.label}>Ingresos Mensuales Registrados</Text>
            <Text style={styles.value}>Q{user?.ingresosMensuales?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Dirección Domiciliar</Text>

        <View style={styles.infoRow}>
          <MapPin size={20} color={COLORS.primary} style={styles.icon} />
          <View>
            <Text style={styles.label}>Municipio y Departamento</Text>
            <Text style={styles.value}>
              {user?.direccion?.municipio}, {user?.direccion?.departamento}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={20} color={COLORS.primary} style={styles.icon} />
          <View>
            <Text style={styles.label}>Zona y Detalle</Text>
            <Text style={styles.value}>
              Zona {user?.direccion?.zona} - {user?.direccion?.detalle}
            </Text>
          </View>
        </View>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    marginRight: 16,
  },
  label: {
    fontSize: 11,
    color: COLORS.mediumGray,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: 'bold',
    marginTop: 2,
  },
});
