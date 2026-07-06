import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowRight, Smartphone, Globe, Landmark, ShieldCheck } from 'lucide-react-native';
import { COLORS } from '../../shared/constants/colors';

export default function TransfersMenuScreen({ navigation }) {
  const options = [
    {
      title: 'Terceros BIK',
      description: 'Transfiere de forma inmediata a otras cuentas de BIK.',
      screen: 'InternalTransfer',
      color: '#DBEAFE',
      iconColor: COLORS.primary,
      icon: ShieldCheck,
    },
    {
      title: 'Otros Bancos (ACH)',
      description: 'Envía fondos a cuentas de otros bancos del sistema nacional.',
      screen: 'AchTransfer',
      color: '#FEF3C7',
      iconColor: COLORS.accent,
      icon: Landmark,
    },
    {
      title: 'Transferencia Móvil',
      description: 'Envía dinero al instante usando el número de teléfono celular.',
      screen: 'MobileTransfer',
      color: '#D1FAE5',
      iconColor: COLORS.success,
      icon: Smartphone,
    },
    {
      title: 'Internacionales (SWIFT)',
      description: 'Envía transferencias al exterior mediante códigos SWIFT o ruteo ABA.',
      screen: 'InternationalTransfer',
      color: '#F3E8FF',
      iconColor: '#A855F7',
      icon: Globe,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>¿Qué tipo de transferencia deseas realizar?</Text>
      <Text style={styles.subtitle}>Selecciona una opción para continuar con tu operación bancaria.</Text>

      {options.map((opt) => {
        const IconComponent = opt.icon;
        return (
          <TouchableOpacity
            key={opt.screen}
            style={styles.optionCard}
            onPress={() => navigation.navigate(opt.screen)}
          >
            <View style={[styles.iconBg, { backgroundColor: opt.color }]}>
              <IconComponent size={24} color={opt.iconColor} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.optionTitle}>{opt.title}</Text>
              <Text style={styles.optionDescription}>{opt.description}</Text>
            </View>
            <ArrowRight size={20} color={COLORS.mediumGray} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 24,
    lineHeight: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 4,
    lineHeight: 16,
  },
});
