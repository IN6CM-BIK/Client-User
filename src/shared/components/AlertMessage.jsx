import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertCircle, CheckCircle } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

export default function AlertMessage({ message, type = 'error' }) {
  if (!message) return null;

  const isError = type === 'error';

  return (
    <View style={[styles.container, isError ? styles.errorBg : styles.successBg]}>
      {isError ? (
        <AlertCircle size={20} color={COLORS.danger} style={styles.icon} />
      ) : (
        <CheckCircle size={20} color={COLORS.success} style={styles.icon} />
      )}
      <Text style={[styles.text, isError ? styles.errorText : styles.successText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  errorBg: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  successBg: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  errorText: {
    color: COLORS.danger,
  },
  successText: {
    color: COLORS.success,
  },
});
