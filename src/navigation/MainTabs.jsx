import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Wallet, ArrowLeftRight, Menu } from 'lucide-react-native';
import HomeScreen from '../features/home/HomeScreen';
import AccountsScreen from '../features/accounts/AccountsScreen';
import TransfersMenuScreen from '../features/transfers/TransfersMenuScreen';
import MoreScreen from '../features/profile/MoreScreen';
import { COLORS } from '../shared/constants/colors';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.darkGray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.lightGray,
          paddingBottom: 5,
          height: 60,
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Inicio') {
            return <Home size={size} color={color} />;
          } else if (route.name === 'Cuentas') {
            return <Wallet size={size} color={color} />;
          } else if (route.name === 'Transferir') {
            return <ArrowLeftRight size={size} color={color} />;
          } else if (route.name === 'Más') {
            return <Menu size={size} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ title: 'Banca Móvil BIK' }} />
      <Tab.Screen name="Cuentas" component={AccountsScreen} options={{ title: 'Mis Cuentas' }} />
      <Tab.Screen name="Transferir" component={TransfersMenuScreen} options={{ title: 'Transferencias' }} />
      <Tab.Screen name="Más" component={MoreScreen} options={{ title: 'Más Servicios' }} />
    </Tab.Navigator>
  );
}
