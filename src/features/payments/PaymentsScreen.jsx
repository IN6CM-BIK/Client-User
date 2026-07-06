import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Send, CheckCircle2, Zap } from 'lucide-react-native';
import { useAccountsStore } from '../accounts/store/accountsStore';
import { bikApi } from '../../shared/api/axiosInstance';
import { COLORS } from '../../shared/constants/colors';
import AlertMessage from '../../shared/components/AlertMessage';

export default function PaymentsScreen({ navigation }) {
  const { accounts, fetchDashboardData } = useAccountsStore();

  const [originId, setOriginId] = useState('');
  const [servicio, setServicio] = useState('EEGSA');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');

  useEffect(() => {
    fetchDashboardData();
    setIdempotencyKey(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }, []);

  const handlePay = async () => {
    if (!originId || !amount) {
      Alert.alert('Campos Incompletos', 'Por favor selecciona la cuenta de origen e ingresa el monto.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Monto Inválido', 'El monto debe ser un número positivo.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      cuentaOrigenId: originId,
      monto: numericAmount,
      servicio,
      descripcion: desc || `Pago del servicio de ${servicio}`
    };

    try {
      const res = await bikApi.post('/services/pay', payload, {
        headers: {
          'X-Idempotency-Key': idempotencyKey
        }
      });
      if (res.data.status === 'success') {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar el pago del servicio.');
    } finally {
      setLoading(false);
    }
  };

  const activeAccounts = accounts.filter(a => !a.isCard && a.estado === 'Activa');
  const servicios = ['EEGSA', 'EMPAGUA', 'Claro', 'Tigo', 'Kinal Colegiatura'];

  if (success) {
    return (
      <View style={styles.successContainer}>
        <CheckCircle2 size={64} color={COLORS.success} />
        <Text style={styles.successTitle}>¡Pago de Servicio Exitoso!</Text>
        <Text style={styles.successText}>La factura de tu servicio ha sido pagada e ingresada correctamente.</Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => {
            setSuccess(false);
            setAmount('');
            setDesc('');
            navigation.navigate('Main', { screen: 'Inicio' });
          }}
        >
          <Text style={styles.doneBtnText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Cuenta de Débito</Text>

        {error && <AlertMessage message={error} />}

        {activeAccounts.length === 0 ? (
          <Text style={styles.warningText}>No tienes cuentas activas para realizar pagos.</Text>
        ) : (
          <View style={styles.accountsContainer}>
            {activeAccounts.map((a) => {
              const isSelected = originId === a.id;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.accountOption, isSelected && styles.accountSelected]}
                  onPress={() => setOriginId(a.id)}
                >
                  <View style={styles.optionDetails}>
                    <Text style={[styles.optionName, isSelected && styles.textWhite]}>{a.name}</Text>
                    <Text style={[styles.optionNum, isSelected && styles.textBlue]}>{a.number}</Text>
                  </View>
                  <Text style={[styles.optionBal, isSelected && styles.textWhite]}>
                    Q{a.balance.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionHeader}>Seleccionar Servicio</Text>
        <View style={styles.serviciosRow}>
          {servicios.map((srv) => {
            const isSel = servicio === srv;
            return (
              <TouchableOpacity
                key={srv}
                style={[styles.serviceOption, isSel && styles.serviceSelected]}
                onPress={() => setServicio(srv)}
              >
                <Text style={[styles.serviceText, isSel && styles.textWhite]}>{srv}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionHeader}>Detalles del Pago</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monto a Pagar (Q) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Número de Referencia / Contrato (Opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Contrato 123456"
            value={desc}
            onChangeText={setDesc}
          />
        </View>

        <TouchableOpacity
          style={[styles.payBtn, (!originId || !amount || loading) && styles.btnDisabled]}
          onPress={handlePay}
          disabled={!originId || !amount || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.payBtnText}>Pagar Servicio</Text>
              <Zap size={18} color={COLORS.white} style={styles.btnIcon} />
            </>
          )}
        </TouchableOpacity>
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
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingBottom: 4,
  },
  accountsContainer: {
    marginBottom: 16,
  },
  accountOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  accountSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionDetails: {
    flex: 1,
  },
  optionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  optionNum: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  optionBal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  textWhite: {
    color: COLORS.white,
  },
  textBlue: {
    color: '#93C5FD',
  },
  serviciosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  serviceOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: COLORS.lightGray,
  },
  serviceSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  inputGroup: {
    marginBottom: 16,
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
  payBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  btnDisabled: {
    backgroundColor: COLORS.mediumGray,
  },
  payBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnIcon: {
    marginLeft: 8,
  },
  warningText: {
    color: COLORS.danger,
    fontSize: 14,
    marginBottom: 16,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  doneBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
