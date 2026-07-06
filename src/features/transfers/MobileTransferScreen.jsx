import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Share } from 'react-native';
import { Send, CheckCircle2, Share2 } from 'lucide-react-native';
import { useAccountsStore } from '../accounts/store/accountsStore';
import { useTransfersStore } from './store/transfersStore';
import { COLORS } from '../../shared/constants/colors';
import AlertMessage from '../../shared/components/AlertMessage';

export default function MobileTransferScreen({ navigation }) {
  const { accounts, fetchDashboardData } = useAccountsStore();
  const { transferMobile, loading, error, success, resetState } = useTransfersStore();

  const [originId, setOriginId] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  useEffect(() => {
    resetState();
    fetchDashboardData();
    setIdempotencyKey(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }, []);

  const handleTransfer = async () => {
    if (!originId || !phone || !amount) {
      Alert.alert('Campos Incompletos', 'Por favor complete todos los campos.');
      return;
    }

    if (phone.length < 8) {
      Alert.alert('Teléfono Inválido', 'El número de teléfono debe tener al menos 8 dígitos.');
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
      descripcion: desc || `Transferencia móvil al celular ${phone}`
    };

    try {
      await transferMobile(payload, idempotencyKey);
    } catch (e) {}
  };

  const handleShareReceipt = async () => {
    const dateStr = new Date().toLocaleString();
    const receiptText = `
=================================
  BANCO BIK - TRANSFERENCIA MÓVIL
=================================
No. Referencia: ${idempotencyKey.toUpperCase().substring(0, 12)}
Fecha: ${dateStr}
Estado: EXITOSO

Monto Transferido: Q ${parseFloat(amount).toFixed(2)}

Cuenta Origen: ${selectedOriginAccount?.number} (${selectedOriginAccount?.tipo})
Celular Destino: ${phone}
Concepto: ${desc || 'Transferencia Móvil'}
=================================
¡Gracias por utilizar Banca Móvil BIK!
    `;

    try {
      await Share.share({
        message: receiptText,
        title: 'Comprobante de Transferencia Móvil BIK'
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
            <Text style={styles.receiptTitle}>¡Transferencia Móvil!</Text>
            <Text style={styles.receiptSubtitle}>Comprobante Electrónico</Text>
          </View>

          <View style={styles.receiptDivider} />

          <View style={styles.receiptBody}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Monto Enviado</Text>
              <Text style={styles.receiptAmount}>
                Q{parseFloat(amount).toFixed(2)}
              </Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Cuenta Origen</Text>
              <Text style={styles.receiptValue}>{selectedOriginAccount?.name}</Text>
              <Text style={styles.receiptSubvalue}>{selectedOriginAccount?.number}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Celular Destinatario</Text>
              <Text style={styles.receiptValue}>{phone}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Descripción</Text>
              <Text style={styles.receiptValue}>{desc || 'Transferencia Móvil (Celular)'}</Text>
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
          
          <Text style={styles.receiptFooterText}>Banco BIK • Transferencias al instante</Text>
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
                    Q{a.balance.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionHeader}>Datos del Beneficiario</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Número de Celular *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. 55554444"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={8}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monto a Transferir (Q) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción o Comentario (Opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Envío de efectivo"
            value={desc}
            onChangeText={setDesc}
          />
        </View>

        <TouchableOpacity
          style={[styles.transferBtn, (!originId || !phone || !amount || loading) && styles.btnDisabled]}
          onPress={handleTransfer}
          disabled={!originId || !phone || !amount || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.transferBtnText}>Enviar Transferencia</Text>
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
