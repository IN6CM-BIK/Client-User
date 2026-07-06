import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { QrCode, Scan, Landmark, Send, CheckCircle2 } from 'lucide-react-native';
import { useAccountsStore } from '../accounts/store/accountsStore';
import { bikApi } from '../../shared/api/axiosInstance';
import { COLORS } from '../../shared/constants/colors';
import AlertMessage from '../../shared/components/AlertMessage';

export default function QrPayScreen({ navigation }) {
  const { accounts } = useAccountsStore();
  const [activeMode, setActiveMode] = useState('pay'); // 'pay' o 'collect'
  
  // Pagar QR
  const [originId, setOriginId] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Cobrar QR
  const [targetAccountNum, setTargetAccountNum] = useState('');
  const [collectAmount, setCollectAmount] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);

  const handlePayQr = async () => {
    if (!originId || !qrCodeData) {
      Alert.alert('Datos Faltantes', 'Por favor selecciona la cuenta de origen e ingresa el código QR.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Intentar parsear el JSON del QR
      const parsedData = JSON.parse(qrCodeData);
      const { cuentaDestinoId, monto } = parsedData;

      if (!cuentaDestinoId || !monto) {
        throw new Error('El código QR no contiene el formato esperado (cuentaDestinoId y monto).');
      }

      const res = await bikApi.post('/qr/pay', {
        cuentaOrigenId: originId,
        cuentaDestinoId,
        monto: parseFloat(monto)
      });

      if (res.data.status === 'success') {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al procesar el pago QR.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQr = () => {
    if (!targetAccountNum || !collectAmount) {
      Alert.alert('Datos Faltantes', 'Por favor ingresa todos los datos para generar el cobro.');
      return;
    }

    const numericAmount = parseFloat(collectAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Monto Inválido', 'El monto debe ser un número positivo.');
      return;
    }

    // Buscar el ObjectId real de la cuenta seleccionada para incluir en el QR
    const matchedAccount = accounts.find(a => a.number === targetAccountNum);
    if (!matchedAccount) {
      Alert.alert('Cuenta No Encontrada', 'No se pudo asociar el número de cuenta.');
      return;
    }

    const payload = {
      cuentaDestinoId: matchedAccount.id,
      monto: numericAmount,
      referencia: 'Cobro instantáneo BIK'
    };

    setGeneratedCode(JSON.stringify(payload));
  };

  const activeAccounts = accounts.filter(a => !a.isCard && a.estado === 'Activa');

  if (success) {
    return (
      <View style={styles.successContainer}>
        <CheckCircle2 size={64} color={COLORS.success} />
        <Text style={styles.successTitle}>¡Pago QR Completado!</Text>
        <Text style={styles.successText}>La transferencia instantánea mediante código QR se ha procesado exitosamente.</Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => {
            setSuccess(false);
            setQrCodeData('');
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
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.tabItem, activeMode === 'pay' && styles.tabActive]}
          onPress={() => setActiveMode('pay')}
        >
          <Text style={[styles.tabText, activeMode === 'pay' && styles.textWhite]}>Pagar con QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeMode === 'collect' && styles.tabActive]}
          onPress={() => setActiveMode('collect')}
        >
          <Text style={[styles.tabText, activeMode === 'collect' && styles.textWhite]}>Cobrar con QR</Text>
        </TouchableOpacity>
      </View>

      {activeMode === 'pay' ? (
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Cuenta de Débito</Text>

          {error && <AlertMessage message={error} />}

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

          <Text style={styles.sectionHeader}>Escanear o Ingresar Código QR</Text>
          <Text style={styles.infoText}>
            En el simulador, ingresa el texto JSON del código QR generado (por ejemplo, el que generas en la pestaña "Cobrar").
          </Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            placeholder='{"cuentaDestinoId":"id_cuenta","monto":100}'
            value={qrCodeData}
            onChangeText={setQrCodeData}
          />

          <TouchableOpacity
            style={[styles.actionBtn, (!originId || !qrCodeData || loading) && styles.btnDisabled]}
            onPress={handlePayQr}
            disabled={!originId || !qrCodeData || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.btnText}>Procesar Pago QR</Text>
                <Send size={18} color={COLORS.white} style={styles.btnIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Configurar Cobro</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Selecciona la cuenta para recibir el cobro *</Text>
            <View style={styles.accountsContainer}>
              {activeAccounts.map((a) => {
                const isSelected = targetAccountNum === a.number;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.accountOption, isSelected && styles.accountSelected]}
                    onPress={() => setTargetAccountNum(a.number)}
                  >
                    <View style={styles.optionDetails}>
                      <Text style={[styles.optionName, isSelected && styles.textWhite]}>{a.name}</Text>
                      <Text style={[styles.optionNum, isSelected && styles.textBlue]}>{a.number}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monto a Cobrar (Q) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={collectAmount}
              onChangeText={setCollectAmount}
            />
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, (!targetAccountNum || !collectAmount) && styles.btnDisabled]}
            onPress={handleGenerateQr}
            disabled={!targetAccountNum || !collectAmount}
          >
            <Text style={styles.btnText}>Generar Código QR</Text>
            <QrCode size={18} color={COLORS.white} style={styles.btnIcon} />
          </TouchableOpacity>

          {generatedCode && (
            <View style={styles.qrResultCard}>
              <Text style={styles.qrTitle}>Código QR de Cobro</Text>
              <View style={styles.qrMockPlaceholder}>
                <QrCode size={140} color={COLORS.primary} />
              </View>
              <Text style={styles.qrSubText}>Comparte este código para recibir el pago.</Text>
              <TextInput
                style={styles.qrCodeTextDisplay}
                editable={false}
                selectTextOnFocus
                value={generatedCode}
              />
            </View>
          )}
        </View>
      )}
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
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabItem: {
    flex: 1,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  textWhite: {
    color: COLORS.white,
  },
  textBlue: {
    color: '#93C5FD',
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
  infoText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 12,
    lineHeight: 18,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.black,
    height: 44,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingVertical: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  actionBtn: {
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
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnIcon: {
    marginLeft: 8,
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
  qrResultCard: {
    marginTop: 24,
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  qrMockPlaceholder: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  qrSubText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 12,
    textAlign: 'center',
  },
  qrCodeTextDisplay: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 8,
    width: '100%',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: COLORS.darkGray,
    textAlign: 'center',
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
