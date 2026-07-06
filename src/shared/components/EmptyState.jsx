import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HelpCircle } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

export default function EmptyState({ title = 'No hay datos', description = 'Inténtelo de nuevo más tarde.', icon: Icon = HelpCircle }) {
  return (
    <View style={styles.container}>
      <Icon size={48} color={COLORS.mediumGray} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
});
