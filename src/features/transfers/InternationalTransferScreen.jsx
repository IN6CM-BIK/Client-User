import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Share } from 'react-native';
import { Send, CheckCircle2, Share2 } from 'lucide-react-native';
import { useAccountsStore } from '../accounts/store/accountsStore';
import { useTransfersStore } from './store/transfersStore';
import { COLORS } from '../../shared/constants/colors';
import AlertMessage from '../../shared/components/AlertMessage';

export default function InternationalTransferScreen({ navigation }) {
  const { accounts, fetchDashboardData } = useAccountsStore();
  const { transferInternational, loading, error, success, resetState } = useTransfersStore();

  const [originId, setOriginId] = useState('');
  const [swift, setSwift] = useState('');
  const [aba, setAba] = useState('');
  const [banco, setBanco] = useState('');
  const [iban, setIban] = useState('');
  const [beneficiario, setBeneficiario] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  useEffect(() => {
    resetState();
    fetchDashboardData();
    setIdempotencyKey(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }, []);

  const handleTransfer = async () => {
    if (!originId || !swift || !banco || !iban || !beneficiario || !amount) {
      Alert.alert('Campos Incompletos', 'Por favor complete todos los campos obligatorios (*).');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Monto Inválido', 'El monto debe ser un número positivo.');
      return;
    }

    const payload = {
      cuentaOrigenId: originId,
      monto: numericAmount,
      descripcion: desc || `Transferencia Internacional SWIFT a ${beneficiario}`,
      internationalDetails: {
        swiftBic: swift,
        abaRouting: aba || '',
        bancoDestino: banco,
        cuentaIban: iban,
        nombreBeneficiario: beneficiario,
        motivoTransferencia: desc || 'Gastos personales / familiares',
        comisionAplicada: 25.00 // Comisión predeterminada estándar
      }
    };

    try {
      await transferInternational(payload, idempotencyKey);
    } catch (e) {}
  };

  const handleShareReceipt = async () => {
    const dateStr = new Date().toLocaleString();
    const receiptText = `
=================================
  BANCO BIK - COMPROBANTE SWIFT
=================================
No. Referencia: ${idempotencyKey.toUpperCase().substring(0, 12)}
Fecha: ${dateStr}
Estado: PROCESADO SWIFT

Monto Transferido: ${selectedOriginAccount?.moneda === 'USD' ? '$' : 'Q'} ${parseFloat(amount).toFixed(2)}
Comisión SWIFT: $ 25.00

Cuenta Origen: ${selectedOriginAccount?.number} (${selectedOriginAccount?.tipo})
Banco Corresponsal: ${banco}
SWIFT / BIC: ${swift}
ABA / Routing: ${aba || 'N/A'}
Cuenta IBAN Destino: ${iban}
Beneficiario: ${beneficiario}
Concepto: ${desc || 'Transferencia Internacional'}
=================================
¡Gracias por utilizar Banca Móvil BIK!
    `;

    try {
      await Share.share({
        message: receiptText,
        title: 'Comprobante de Transferencia Internacional'
      });
    } catch (err) {
      Alert.alert('Error', 'No se pudo compartir el comprobante.');
    }
  };

  const activeAccounts = accounts.filter(a => !a.isCard && a.estado === 'Activa');
  const selectedOriginAccount = accounts.find(a => a.id === originId);

  if (success) {
    return (
      <ScrollView style={styles.successScroll} contentContainerStyle={styles.successScrollContent}>
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <CheckCircle2 size={48} color={COLORS.success} />
            <Text style={styles.receiptTitle}>¡Transferencia SWIFT!</Text>
            <Text style={styles.receiptSubtitle}>Comprobante Internacional</Text>
          </View>

          <View style={styles.receiptDivider} />

          <View style={styles.receiptBody}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Monto Principal</Text>
              <Text style={styles.receiptAmount}>
                {selectedOriginAccount?.moneda === 'USD' ? '$' : 'Q'}{parseFloat(amount).toFixed(2)}
              </Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Comisión Operativa</Text>
              <Text style={styles.receiptValue}>$ 25.00 USD</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Cuenta Origen</Text>
              <Text style={styles.receiptValue}>{selectedOriginAccount?.name}</Text>
              <Text style={styles.receiptSubvalue}>{selectedOriginAccount?.number}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Beneficiario</Text>
              <Text style={styles.receiptValue}>{beneficiario}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Banco Destino Corresponsal</Text>
              <Text style={styles.receiptValue}>{banco}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Código SWIFT / BIC</Text>
              <Text style={styles.receiptValue}>{swift}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Cuenta IBAN</Text>
              <Text style={styles.receiptValue}>{iban}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>No. Referencia</Text>
              <Text style={styles.receiptValue}>{idempotencyKey.toUpperCase().substring(0, 12)}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Fecha y Hora</Text>
              <Text style={styles.receiptValue}>{new Date().toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.receiptDivider} />
          
          <Text style={styles.receiptFooterText}>Banco BIK • Red SWIFT Internacional</Text>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShareReceipt}>
          <Share2 size={18} color={COLORS.white} style={styles.btnIcon} />
          <Text style={styles.shareBtnText}>Compartir / Guardar Comprobante</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneBtnLink}
          onPress={() => {
            resetState();
            navigation.navigate('Main', { screen: 'Inicio' });
          }}
        >
          <Text style={styles.doneBtnLinkText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Cuenta de Origen</Text>

        {error && <AlertMessage message={error} />}

        {activeAccounts.length === 0 ? (
          <Text style={styles.warningText}>No tienes cuentas activas para realizar transferencias.</Text>
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
                    {a.moneda === 'USD' ? '$' : 'Q'}{a.balance.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionHeader}>Datos de Destino Internacional</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Código SWIFT / BIC *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. BIKAGT12"
            value={swift}
            onChangeText={setSwift}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Código ABA / Routing (Opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. 021000021"
            value={aba}
            onChangeText={setAba}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Banco Destino *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. JPMorgan Chase Bank"
            value={banco}
            onChangeText={setBanco}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cuenta Destino / IBAN *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. US1234567890"
            value={iban}
            onChangeText={setIban}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del Beneficiario *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. John Doe Corp"
            value={beneficiario}
            onChangeText={setBeneficiario}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monto a Transferir *</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción o Concepto (Opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Pago de facturas o ayuda familiar"
            value={desc}
            onChangeText={setDesc}
          />
        </View>

        <TouchableOpacity
          style={[styles.transferBtn, (!originId || !swift || !banco || !iban || !beneficiario || !amount || loading) && styles.btnDisabled]}
          onPress={handleTransfer}
          disabled={!originId || !swift || !banco || !iban || !beneficiario || !amount || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.transferBtnText}>Enviar Orden SWIFT</Text>
              <Send size={18} color={COLORS.white} style={styles.btnIcon} />
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
  transferBtn: {
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
  transferBtnText: {
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
  successScroll: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  successScrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  receiptCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 12,
  },
  receiptSubtitle: {
    fontSize: 12,
    color: COLORS.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: 1,
  },
  receiptBody: {
    gap: 16,
  },
  receiptRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    paddingBottom: 8,
  },
  receiptLabel: {
    fontSize: 11,
    color: COLORS.mediumGray,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  receiptAmount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  receiptSubvalue: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  receiptFooterText: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
  },
  shareBtn: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
    width: '100%',
    marginBottom: 12,
    gap: 8,
  },
  shareBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  doneBtnLink: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  doneBtnLinkText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
