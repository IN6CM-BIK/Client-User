import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Globe, ArrowLeftRight, TrendingUp } from 'lucide-react-native';
import { bikApi } from '../../shared/api/axiosInstance';
import { COLORS } from '../../shared/constants/colors';

export default function ExchangeRateScreen() {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calculadora
  const [usdVal, setUsdVal] = useState('1');
  const [gtqVal, setGtqVal] = useState('');

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await bikApi.get('/currency/rates');
      const rateData = res.data.data?.[0] || { tasaCompra: 7.75, tasaVenta: 7.95 };
      setRates(rateData);
      // Calcular valor inicial
      const val = parseFloat(usdVal) * rateData.tasaVenta;
      setGtqVal(val.toFixed(2));
    } catch (err) {
      console.error('Error fetching rates:', err.message);
      // Fallback
      setRates({ tasaCompra: 7.75, tasaVenta: 7.95 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleUsdChange = (val) => {
    setUsdVal(val);
    if (!val) {
      setGtqVal('');
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num) && rates) {
      setGtqVal((num * rates.tasaVenta).toFixed(2));
    }
  };

  const handleGtqChange = (val) => {
    setGtqVal(val);
    if (!val) {
      setUsdVal('');
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num) && rates) {
      setUsdVal((num / rates.tasaCompra).toFixed(2));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <View style={styles.rateHeader}>
          <Globe size={24} color={COLORS.primary} />
          <Text style={styles.rateTitle}>Tipo de Cambio USD / GTQ</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : rates ? (
          <View style={styles.ratesGrid}>
            <View style={styles.rateBox}>
              <Text style={styles.rateLabel}>TASA COMPRA</Text>
              <Text style={styles.rateValue}>Q{rates.tasaCompra.toFixed(2)}</Text>
              <Text style={styles.rateSubText}>Compramos tus dólares</Text>
            </View>
            <View style={styles.rateBox}>
              <Text style={styles.rateLabel}>TASA VENTA</Text>
              <Text style={styles.rateValue}>Q{rates.tasaVenta.toFixed(2)}</Text>
              <Text style={styles.rateSubText}>Te vendemos dólares</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.updateInfo}>
          <TrendingUp size={16} color={COLORS.mediumGray} />
          <Text style={styles.updateText}>
            Última actualización: {rates?.fechaActualizacion ? new Date(rates.fechaActualizacion).toLocaleString() : 'Hoy'}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Conversor de Divisas</Text>

      <View style={styles.card}>
        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Dólar (USD)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={usdVal}
              onChangeText={handleUsdChange}
              placeholder="0.00"
            />
          </View>

          <View style={styles.arrowContainer}>
            <ArrowLeftRight size={20} color={COLORS.mediumGray} />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Quetzal (GTQ)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={gtqVal}
              onChangeText={handleGtqChange}
              placeholder="0.00"
            />
          </View>
        </View>

        <Text style={styles.calcNote}>
          * Las conversiones utilizan la tasa de venta para USD → GTQ y tasa de compra para GTQ → USD.
        </Text>
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
    marginBottom: 20,
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  rateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  ratesGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  rateBox: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rateLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.mediumGray,
    letterSpacing: 1,
  },
  rateValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginVertical: 4,
  },
  rateSubText: {
    fontSize: 11,
    color: COLORS.darkGray,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    justifyContent: 'center',
  },
  updateText: {
    fontSize: 11,
    color: COLORS.mediumGray,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 4,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 6,
  },
  input: {
    height: 44,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  arrowContainer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  calcNote: {
    fontSize: 10,
    color: COLORS.mediumGray,
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
