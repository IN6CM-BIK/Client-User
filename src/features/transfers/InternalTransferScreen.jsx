import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, Share } from 'react-native';
import { Send, CheckCircle2, UserCheck, AlertCircle, ChevronDown, BookOpen, Check, X, Share2 } from 'lucide-react-native';
import { useAccountsStore } from '../accounts/store/accountsStore';
import { useTransfersStore } from './store/transfersStore';
import { useContactsStore } from '../accounts/store/contactsStore';
import { COLORS } from '../../shared/constants/colors';
import { bikApi } from '../../shared/api/axiosInstance';
import AlertMessage from '../../shared/components/AlertMessage';

export default function InternalTransferScreen({ navigation }) {
  const { accounts, fetchDashboardData, validateDestinationAccount } = useAccountsStore();
  const { transferInternal, loading, error, success, resetState } = useTransfersStore();
  const { contacts, fetchContacts, addContact } = useContactsStore();

  const [originId, setOriginId] = useState('');
  const [destNumber, setDestNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Tasas de cambio de base de datos
  const [rates, setRates] = useState({ tasaCompra: 7.75, tasaVenta: 7.95 });

  // Estado de validación de cuenta destino
  const [validatingDest, setValidatingDest] = useState(false);
  const [destValidation, setDestValidation] = useState(null); // { titularNombre, tipo, moneda }
  const [destError, setDestError] = useState('');

  // Moneda de envío
  const [transferMoneda, setTransferMoneda] = useState('GTQ');

  // Guardar contacto y modal
  const [saveContact, setSaveContact] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);

  const selectedOriginAccount = accounts.find(a => a.id === originId);

  const fetchRates = async () => {
    try {
      const res = await bikApi.get('/currency/rates');
      const rateData = res.data.data?.[0] || { tasaCompra: 7.75, tasaVenta: 7.95 };
      setRates(rateData);
    } catch (err) {
      console.error('Error fetching rates for conversion:', err.message);
    }
  };

  // Generar idempotency key única en el montaje
  useEffect(() => {
    resetState();
    fetchDashboardData();
    fetchContacts();
    fetchRates();
    setIdempotencyKey(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }, []);

  // Cambiar moneda de envío por defecto cuando cambie la cuenta de origen
  useEffect(() => {
    if (selectedOriginAccount) {
      setTransferMoneda(selectedOriginAccount.moneda || 'GTQ');
    }
  }, [originId]);

  /**
   * Valida la cuenta destino cuando el usuario termina de escribir el número.
   * Se llama al perder foco del campo o cuando el texto tiene suficientes caracteres.
   */
  const handleValidateDestination = useCallback(async () => {
    if (!destNumber || destNumber.length < 6) {
      setDestValidation(null);
      setDestError('');
      return;
    }

    setValidatingDest(true);
    setDestError('');
    setDestValidation(null);

    try {
      const result = await validateDestinationAccount(destNumber);
      setDestValidation(result);
    } catch (err) {
      setDestError(err.message);
    } finally {
      setValidatingDest(false);
    }
  }, [destNumber, validateDestinationAccount]);

  const handleDestNumberChange = (text) => {
    setDestNumber(text);
    // Reset validación cuando cambia el texto
    setDestValidation(null);
    setDestError('');
  };

  const handleSelectContact = async (contact) => {
    setDestNumber(contact.numeroCuenta);
    setDestValidation(null);
    setDestError('');
    setShowContactsModal(false);

    setValidatingDest(true);
    try {
      const result = await validateDestinationAccount(contact.numeroCuenta);
      setDestValidation(result);
    } catch (err) {
      setDestError(err.message);
    } finally {
      setValidatingDest(false);
    }
  };

  const handleTransfer = async () => {
    if (!originId || !destNumber || !amount) {
      Alert.alert('Campos Incompletos', 'Por favor complete todos los datos.');
      return;
    }

    if (!destValidation) {
      Alert.alert('Cuenta No Validada', 'Debe validar la cuenta destino antes de transferir.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Monto Inválido', 'El monto debe ser un número positivo.');
      return;
    }

    const payload = {
      cuentaOrigenId: originId,
      cuentaDestinoId: destNumber,
      monto: numericAmount,
      descripcion: desc || 'Transferencia a terceros BIK',
      monedaTransferencia: transferMoneda
    };

    try {
      await transferInternal(payload, idempotencyKey);

      // Guardar en contactos si se seleccionó la opción
      if (saveContact) {
        const contactExists = contacts.some(
          (c) => c.numeroCuenta === destNumber && c.tipoDestinatario === 'BIK'
        );
        if (!contactExists) {
          try {
            await addContact({
              alias: destValidation.titularNombre,
              tipoDestinatario: 'BIK',
              banco: 'BIK',
              numeroCuenta: destNumber,
              tipoCuenta: destValidation.tipo || 'Monetaria'
            });
          } catch (contactErr) {
            console.error('Error al guardar contacto:', contactErr.message);
          }
        }
      }
    } catch (e) {
      // El error ya está en useTransfersStore
    }
  };

  const getConversionDetails = () => {
    if (!selectedOriginAccount || !amount || isNaN(parseFloat(amount))) return null;
    const numericAmount = parseFloat(amount);
    
    const originMoneda = selectedOriginAccount.moneda || 'GTQ';
    const destMoneda = destValidation ? (destValidation.moneda || 'GTQ') : originMoneda;

    // Caso 1: Origen USD y Destino GTQ
    if (originMoneda === 'USD' && destMoneda === 'GTQ') {
      if (transferMoneda === 'USD') {
        const credited = numericAmount * rates.tasaCompra;
        return {
          label: 'Acreditación estimada en destino (Quetzales)',
          value: `Q ${credited.toFixed(2)}`,
          info: `Tasa de compra aplicada: Q ${rates.tasaCompra.toFixed(2)}`
        };
      } else if (transferMoneda === 'GTQ') {
        const debited = numericAmount / rates.tasaCompra;
        return {
          label: 'Débito estimado en origen (Dólares)',
          value: `$ ${debited.toFixed(2)}`,
          info: `Tasa de compra aplicada: Q ${rates.tasaCompra.toFixed(2)}`
        };
      }
    }
    
    // Caso 2: Origen GTQ y Destino USD
    if (originMoneda === 'GTQ' && destMoneda === 'USD') {
      if (transferMoneda === 'GTQ') {
        const credited = numericAmount / rates.tasaVenta;
        return {
          label: 'Acreditación estimada en destino (Dólares)',
          value: `$ ${credited.toFixed(2)}`,
          info: `Tasa de venta aplicada: Q ${rates.tasaVenta.toFixed(2)}`
        };
      } else if (transferMoneda === 'USD') {
        const debited = numericAmount * rates.tasaVenta;
        return {
          label: 'Débito estimado en origen (Quetzales)',
          value: `Q ${debited.toFixed(2)}`,
          info: `Tasa de venta aplicada: Q ${rates.tasaVenta.toFixed(2)}`
        };
      }
    }

    // Caso 3: Origen USD y Destino USD, pero transferimos en GTQ
    if (originMoneda === 'USD' && destMoneda === 'USD' && transferMoneda === 'GTQ') {
      const debited = numericAmount / rates.tasaCompra;
      return {
        label: 'Débito estimado en origen (Dólares)',
        value: `$ ${debited.toFixed(2)}`,
        info: `Conversión informativa @ TC Compra: Q ${rates.tasaCompra.toFixed(2)}`
      };
    }

    // Caso 4: Origen USD y Destino USD, y transferimos en USD
    if (originMoneda === 'USD' && destMoneda === 'USD' && transferMoneda === 'USD') {
      const equivGtq = numericAmount * rates.tasaCompra;
      return {
        label: 'Equivalente de débito en Quetzales (Informativo)',
        value: `Q ${equivGtq.toFixed(2)}`,
        info: `Tasa de compra de referencia: Q ${rates.tasaCompra.toFixed(2)}`
      };
    }

    return null;
  };

  const handleShareReceipt = async () => {
    const dateStr = new Date().toLocaleString();
    const conversionInfo = getConversionDetails();
    const receiptText = `
=================================
     BANCO BIK - COMPROBANTE
=================================
No. Referencia: ${idempotencyKey.toUpperCase().substring(0, 12)}
Fecha: ${dateStr}
Estado: EXITOSO

Monto Transferido: ${transferMoneda === 'USD' ? '$' : 'Q'} ${parseFloat(amount).toFixed(2)}
${conversionInfo ? `${conversionInfo.label}: ${conversionInfo.value}\n${conversionInfo.info}` : ''}

Cuenta Origen: ${selectedOriginAccount?.number} (${selectedOriginAccount?.tipo})
Cuenta Destino: ${destNumber}
Beneficiario: ${destValidation?.titularNombre}
Concepto: ${desc || 'Transferencia a terceros BIK'}
=================================
¡Gracias por utilizar Banca Móvil BIK!
    `;

    try {
      await Share.share({
        message: receiptText,
        title: 'Comprobante de Transferencia BIK'
      });
    } catch (err) {
      Alert.alert('Error', 'No se pudo compartir el comprobante.');
    }
  };

  const activeAccounts = accounts.filter(a => !a.isCard && a.estado === 'Activa');
  const bikContacts = contacts.filter(c => c.tipoDestinatario === 'BIK');

  const showCurrencySelector = selectedOriginAccount?.moneda === 'USD' || (selectedOriginAccount?.moneda === 'GTQ' && destValidation?.moneda === 'USD');
  const conversion = getConversionDetails();

  if (success) {
    const conversionInfo = getConversionDetails();
    return (
      <ScrollView style={styles.successScroll} contentContainerStyle={styles.successScrollContent}>
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <CheckCircle2 size={48} color={COLORS.success} />
            <Text style={styles.receiptTitle}>¡Transferencia Exitosa!</Text>
            <Text style={styles.receiptSubtitle}>Comprobante Electrónico</Text>
          </View>

          <View style={styles.receiptDivider} />

          <View style={styles.receiptBody}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Monto Transferido</Text>
              <Text style={styles.receiptAmount}>
                {transferMoneda === 'USD' ? '$' : 'Q'}{parseFloat(amount).toFixed(2)}
              </Text>
            </View>

            {conversionInfo && (
              <View style={styles.receiptConversionBox}>
                <Text style={styles.receiptConversionLabel}>{conversionInfo.label}</Text>
                <Text style={styles.receiptConversionValue}>{conversionInfo.value}</Text>
                <Text style={styles.receiptConversionRate}>{conversionInfo.info}</Text>
              </View>
            )}

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Cuenta Origen</Text>
              <Text style={styles.receiptValue}>{selectedOriginAccount?.name}</Text>
              <Text style={styles.receiptSubvalue}>{selectedOriginAccount?.number}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Cuenta Destino</Text>
              <Text style={styles.receiptValue}>{destNumber}</Text>
              <Text style={styles.receiptSubvalue}>BIK • Monetaria</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Beneficiario</Text>
              <Text style={styles.receiptValue}>{destValidation?.titularNombre}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Concepto</Text>
              <Text style={styles.receiptValue}>{desc || 'Transferencia a terceros BIK'}</Text>
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
          
          <Text style={styles.receiptFooterText}>Banco BIK • Comprometidos contigo</Text>
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

        <Text style={styles.sectionHeader}>Datos de Destino</Text>

        {/* Selector de Destinatarios Guardados (Siempre visible) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Seleccionar Destinatario Guardado</Text>
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => setShowContactsModal(true)}
          >
            <View style={styles.pickerTriggerContent}>
              <BookOpen size={16} color={COLORS.primary} style={styles.pickerIcon} />
              <Text style={styles.pickerTriggerText}>Buscar en mis contactos...</Text>
            </View>
            <ChevronDown size={18} color={COLORS.mediumGray} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Número de Cuenta Destinatario *</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="Ej. 4000000001"
              value={destNumber}
              onChangeText={handleDestNumberChange}
              onBlur={handleValidateDestination}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              style={[styles.validateBtn, validatingDest && styles.btnDisabledSmall]}
              onPress={handleValidateDestination}
              disabled={validatingDest || destNumber.length < 6}
            >
              {validatingDest ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <UserCheck size={18} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Resultado de validación de cuenta destino */}
        {destValidation && (
          <View style={styles.validationSuccess}>
            <CheckCircle2 size={18} color={COLORS.success} />
            <Text style={styles.validationSuccessText}>Cuenta verificada ({destValidation.moneda})</Text>
          </View>
        )}
        {destError !== '' && (
          <View style={styles.validationError}>
            <AlertCircle size={18} color={COLORS.danger} />
            <Text style={styles.validationErrorText}>{destError}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Titular de la Cuenta Destino</Text>
          <TextInput
            style={[styles.input, styles.inputReadonly]}
            value={destValidation ? destValidation.titularNombre : ''}
            placeholder="Se completará automáticamente al validar"
            editable={false}
          />
        </View>

        {/* Selector de Moneda de Envío si aplica */}
        {showCurrencySelector && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Moneda a Transferir *</Text>
            <View style={styles.selectorRow}>
              {['GTQ', 'USD'].map((curr) => {
                const isSel = transferMoneda === curr;
                return (
                  <TouchableOpacity
                    key={curr}
                    style={[styles.selectorBtn, isSel && styles.selectorActive]}
                    onPress={() => setTransferMoneda(curr)}
                  >
                    <Text style={[styles.selectorText, isSel && styles.textWhite]}>
                      {curr === 'USD' ? 'Dólares (USD)' : 'Quetzales (GTQ)'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monto a Transferir ({transferMoneda}) *</Text>
          <TextInput
            style={styles.input}
            placeholder={transferMoneda === 'USD' ? '$ 0.00' : 'Q 0.00'}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Equivalente de conversión deshabilitado */}
        {conversion && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{conversion.label}</Text>
            <TextInput
              style={[styles.input, styles.inputReadonly]}
              value={conversion.value}
              editable={false}
            />
            <Text style={styles.infoLabel}>{conversion.info}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción o Motivo (Opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Pago de Alquiler"
            value={desc}
            onChangeText={setDesc}
          />
        </View>

        {/* Checkbox para guardar contacto */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setSaveContact(!saveContact)}
        >
          <View style={[styles.checkbox, saveContact && styles.checkboxChecked]}>
            {saveContact && <Check size={14} color={COLORS.white} />}
          </View>
          <Text style={styles.checkboxLabel}>Guardar esta cuenta para futuras ocasiones</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.transferBtn, (!originId || !destNumber || !amount || !destValidation || loading) && styles.btnDisabled]}
          onPress={handleTransfer}
          disabled={!originId || !destNumber || !amount || !destValidation || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.transferBtnText}>Confirmar Transferencia</Text>
              <Send size={18} color={COLORS.white} style={styles.btnIcon} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Contactos BIK */}
      <Modal
        visible={showContactsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContactsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Contacto BIK</Text>
              <TouchableOpacity onPress={() => setShowContactsModal(false)}>
                <X size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {bikContacts.length === 0 ? (
                <View style={styles.emptyContactsContainer}>
                  <BookOpen size={48} color={COLORS.mediumGray} />
                  <Text style={styles.emptyContactsText}>No tienes contactos guardados para BIK.</Text>
                  <Text style={styles.emptyContactsSubtext}>Puedes registrar destinatarios desde el Mantenimiento de Cuentas o guardarlos al realizar una transferencia exitosa.</Text>
                </View>
              ) : (
                bikContacts.map((contact) => (
                  <TouchableOpacity
                    key={contact._id || contact.id}
                    style={styles.modalItem}
                    onPress={() => handleSelectContact(contact)}
                  >
                    <View style={styles.contactItemDetails}>
                      <Text style={styles.contactName}>{contact.alias}</Text>
                      <Text style={styles.contactAccount}>{contact.numeroCuenta} • BIK ({contact.tipoCuenta})</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  inputReadonly: {
    backgroundColor: '#E5E7EB',
    color: COLORS.darkGray,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
  },
  validateBtn: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabledSmall: {
    backgroundColor: COLORS.mediumGray,
  },
  validationSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  validationSuccessText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },
  validationError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  validationErrorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  pickerTrigger: {
    height: 48,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerTriggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerIcon: {
    marginRight: 8,
  },
  pickerTriggerText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  modalList: {
    marginBottom: 20,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactItemDetails: {
    flexDirection: 'column',
  },
  contactName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  contactAccount: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorBtn: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectorActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.mediumGray,
    marginTop: 6,
    fontStyle: 'italic',
  },
  emptyContactsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyContactsText: {
    color: COLORS.darkGray,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyContactsSubtext: {
    color: COLORS.mediumGray,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
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
  receiptConversionBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  receiptConversionLabel: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  receiptConversionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginTop: 2,
  },
  receiptConversionRate: {
    fontSize: 10,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
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
