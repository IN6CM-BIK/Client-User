import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function StatusBadge({ status }) {
  const getStyle = () => {
    switch (status?.toLowerCase()) {
      case 'activa':
      case 'activo':
      case 'aprobada':
      case 'completada':
        return { bg: '#D1FAE5', text: '#065F46' }; // Green
      case 'bloqueada':
      case 'cancelada':
      case 'rechazada':
      case 'fallida':
      case 'suspendida':
      case 'suspendido':
        return { bg: '#FEE2E2', text: '#991B1B' }; // Red
      case 'pendiente':
      case 'en_proceso':
      case 'en verificacion':
      case 'en_verificacion':
        return { bg: '#FEF3C7', text: '#92400E' }; // Yellow
      default:
        return { bg: '#E5E7EB', text: '#374151' }; // Gray
    }
  };

  const stylesColors = getStyle();

  return (
    <View style={[styles.badge, { backgroundColor: stylesColors.bg }]}>
      <Text style={[styles.text, { color: stylesColors.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
});
