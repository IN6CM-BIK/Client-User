import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { User, Lock, FileText, QrCode, Sparkles, Bell, HelpCircle, Shield, LogOut, Settings, ArrowUpDown, CreditCard } from 'lucide-react-native';
import { useAuthStore } from '../auth/store/authStore';
import { COLORS } from '../../shared/constants/colors';

export default function MoreScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const menuGroups = [
    {
      title: 'Mi Cuenta y Seguridad',
      items: [
        {
          title: 'Ver Mi Perfil',
          desc: 'Datos demográficos, DPI y dirección.',
          icon: User,
          color: COLORS.primary,
          screen: 'Profile',
        },
        {
          title: 'Seguridad y Acceso',
          desc: 'Modificar tu contraseña de inicio de sesión.',
          icon: Lock,
          color: COLORS.secondary,
          screen: 'ChangePassword',
        },
      ],
    },
    {
      title: 'Servicios Bancarios',
      items: [
        {
          title: 'Gestiones en Línea',
          desc: 'Solicitar tarjetas o nuevas cuentas digitales.',
          icon: FileText,
          color: COLORS.success,
          screen: 'Requests',
        },
        {
          title: 'Tasas de Cambio',
          desc: 'Ver cotización del dólar estadounidense (USD).',
          icon: Shield,
          color: COLORS.accent,
          screen: 'ExchangeRate',
        },
        {
          title: 'Pago QR',
          desc: 'Cobros y pagos instantáneos con QR.',
          icon: QrCode,
          color: COLORS.danger,
          screen: 'QrPay',
        },
        {
          title: 'Alertas',
          desc: 'Historial de notificaciones y avisos.',
          icon: Bell,
          color: '#8B5CF6',
          screen: 'Notifications',
        },
        {
          title: 'Mantenimiento de Cuentas',
          desc: 'Administrar tus destinatarios y cuentas de terceros.',
          icon: Settings,
          color: COLORS.secondary,
          screen: 'AccountMaintenance',
        },
        {
          title: 'Límites de Transferencia',
          desc: 'Configurar límites diarios de transferencia.',
          icon: ArrowUpDown,
          color: COLORS.primary,
          screen: 'TransferLimits',
        },
        {
          title: 'Bloqueo de Cuentas',
          desc: 'Congelar o descongelar tus propias cuentas bancarias.',
          icon: Shield,
          color: COLORS.danger,
          screen: 'AccountFreeze',
        },
        {
          title: 'Bloqueo de Tarjetas',
          desc: 'Congelar o encender tus tarjetas de crédito y débito.',
          icon: CreditCard,
          color: '#8B5CF6',
          screen: 'Cards',
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {user?.nombres?.charAt(0) || 'U'}
          </Text>
        </View>
        <View>
          <Text style={styles.profileName}>
            {user?.nombres} {user?.apellidos}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
      </View>

      {menuGroups.map((group, idx) => (
        <View key={idx} style={styles.groupContainer}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.groupCard}>
            {group.items.map((item) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={item.screen}
                  style={styles.menuItem}
                  onPress={() => navigation.navigate(item.screen)}
                >
                  <View style={[styles.iconBg, { backgroundColor: item.color + '15' }]}>
                    <IconComponent size={20} color={item.color} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuDesc}>{item.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <LogOut size={20} color={COLORS.danger} style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Cerrar Sesión Activa</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>BIK Banca Móvil v1.0.0 (Kinal)</Text>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    gap: 16,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  profileEmail: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  groupContainer: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.mediumGray,
    marginLeft: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  groupCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  menuDesc: {
    fontSize: 11,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    height: 50,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.mediumGray,
    marginVertical: 16,
  },
});
