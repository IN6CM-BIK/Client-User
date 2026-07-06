import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../features/auth/store/authStore';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

// Sub-pantallas
import AccountDetailScreen from '../features/accounts/AccountDetailScreen';
import AccountMaintenanceScreen from '../features/accounts/AccountMaintenanceScreen';
import AccountFreezeScreen from '../features/accounts/AccountFreezeScreen';
import TransferLimitsScreen from '../features/accounts/TransferLimitsScreen';
import InternalTransferScreen from '../features/transfers/InternalTransferScreen';
import AchTransferScreen from '../features/transfers/AchTransferScreen';
import MobileTransferScreen from '../features/transfers/MobileTransferScreen';
import InternationalTransferScreen from '../features/transfers/InternationalTransferScreen';
import QrPayScreen from '../features/qr/QrPayScreen';
import PaymentsScreen from '../features/payments/PaymentsScreen';
import CardsScreen from '../features/cards/CardsScreen';
import NotificationsScreen from '../features/notifications/NotificationsScreen';
import RequestsScreen from '../features/requests/RequestsScreen';
import NewRequestScreen from '../features/requests/NewRequestScreen';
import ExchangeRateScreen from '../features/currency/ExchangeRateScreen';
import ProfileScreen from '../features/profile/ProfileScreen';
import ChangePasswordScreen from '../features/profile/ChangePasswordScreen';
import { COLORS } from '../shared/constants/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: { backgroundColor: '#F3F4F6' },
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AccountDetail"
        component={AccountDetailScreen}
        options={{ title: 'Detalle de Cuenta' }}
      />
      <Stack.Screen
        name="InternalTransfer"
        component={InternalTransferScreen}
        options={{ title: 'Transferir a Terceros' }}
      />
      <Stack.Screen
        name="AchTransfer"
        component={AchTransferScreen}
        options={{ title: 'Transferencia ACH' }}
      />
      <Stack.Screen
        name="MobileTransfer"
        component={MobileTransferScreen}
        options={{ title: 'Transferencia Móvil' }}
      />
      <Stack.Screen
        name="InternationalTransfer"
        component={InternationalTransferScreen}
        options={{ title: 'Transferencia Internacional' }}
      />
      <Stack.Screen
        name="QrPay"
        component={QrPayScreen}
        options={{ title: 'Cobro / Pago QR' }}
      />
      <Stack.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{ title: 'Pago de Servicios' }}
      />
      <Stack.Screen
        name="Cards"
        component={CardsScreen}
        options={{ title: 'Mis Tarjetas' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Alertas y Notificaciones' }}
      />
      <Stack.Screen
        name="Requests"
        component={RequestsScreen}
        options={{ title: 'Mis Gestiones' }}
      />
      <Stack.Screen
        name="NewRequest"
        component={NewRequestScreen}
        options={{ title: 'Solicitar Producto' }}
      />
      <Stack.Screen
        name="ExchangeRate"
        component={ExchangeRateScreen}
        options={{ title: 'Tasas de Cambio' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Mi Perfil' }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Cambiar Contraseña' }}
      />
      <Stack.Screen
        name="AccountMaintenance"
        component={AccountMaintenanceScreen}
        options={{ title: 'Mantenimiento de Cuentas' }}
      />
      <Stack.Screen
        name="TransferLimits"
        component={TransferLimitsScreen}
        options={{ title: 'Límites de Transferencia' }}
      />
      <Stack.Screen
        name="AccountFreeze"
        component={AccountFreezeScreen}
        options={{ title: 'Bloqueo de Cuentas' }}
      />
    </Stack.Navigator>
  );
}
