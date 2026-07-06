import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, Share } from 'react-native';
import { Send, CheckCircle2, ChevronDown, X, BookOpen, Check, Share2 } from 'lucide-react-native';
import { useAccountsStore } from '../accounts/store/accountsStore';
import { useTransfersStore } from './store/transfersStore';
import { useContactsStore } from '../accounts/store/contactsStore';
import { COLORS } from '../../shared/constants/colors';
import AlertMessage from '../../shared/components/AlertMessage';

export default function AchTransferScreen({ navigation }) {
  const { accounts, fetchDashboardData } = useAccountsStore();
  const { transferACH, loading, error, success, resetState } = useTransfersStore();
  const { contacts, fetchContacts, addContact } = useContactsStore();

  const [originId, setOriginId] = useState('');
  const [banco, setBanco] = useState('Banco Industrial');
  const [showBankModal, setShowBankModal] = useState(false);
  const [destNumber, setDestNumber] = useState('');
  const [alias, setAlias] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('Monetaria');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Guardar contacto y modal
  const [saveContact, setSaveContact] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);

  const BANCOS = [
    'Banco Industrial',
    'Banco G&T Continental',
    'Banrural',
    'Banco de América Central (BAC)',
    'Banco Agromercantil (BAM)',
    'Banco Promerica',
    'Crédito Hipotecario Nacional (CHN)',
    'Banco Ficohsa',
    'Interbanco',
    'Banco Inmobiliario',
    'Banco de Antigua'
  ];

  useEffect(() => {
    resetState();
    fetchDashboardData();
    fetchContacts();
    setIdempotencyKey(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }, []);

  const handleSelectContact = (contact) => {
    setDestNumber(contact.numeroCuenta);
    setBanco(contact.banco);
    setAlias(contact.alias);
    setTipoCuenta(contact.tipoCuenta || 'Monetaria');
    setShowContactsModal(false);
  };

  const handleTransfer = async () => {
    if (!originId || !destNumber || !alias || !amount) {
      Alert.alert('Campos Incompletos', 'Por favor complete todos los campos obligatorios.');
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
      descripcion: desc || `Transferencia ACH a ${alias}`,
      achDetails: {
        bancoDestino: banco,
        titularDestino: alias,
        cuentaDestinoExterna: destNumber,
        tipoCuentaDestino: tipoCuenta
      }
    };

    try {
      await transferACH(payload, idempotencyKey);

      // Guardar contacto si se seleccionó la opción
      if (saveContact) {
        const contactExists = contacts.some(
          (c) => c.numeroCuenta === destNumber && c.tipoDestinatario === 'ACH'
        );
        if (!contactExists) {
          try {
            await addContact({
              alias: alias,
              tipoDestinatario: 'ACH',
              banco: banco,
              numeroCuenta: destNumber,
              tipoCuenta: tipoCuenta
            });
          } catch (contactErr) {
            console.error('Error al guardar contacto ACH:', contactErr.message);
          }
        }
      }
    } catch (e) {}
  };

  const handleShareReceipt = async () => {
    const dateStr = new Date().toLocaleString();
    const receiptText = `
=================================
    BANCO BIK - COMPROBANTE ACH
=================================
No. Referencia: ${idempotencyKey.toUpperCase().substring(0, 12)}
Fecha: ${dateStr}
Estado: SOLICITADO

Monto Transferido: Q ${parseFloat(amount).toFixed(2)}

Cuenta Origen: ${selectedOriginAccount?.number} (${selectedOriginAccount?.tipo})
Banco Destino: ${banco}
Cuenta Destino: ${destNumber}
Beneficiario (Alias): ${alias}
Concepto: ${desc || 'Transferencia ACH'}
=================================
¡Gracias por utilizar Banca Móvil BIK!
    `;

    try {
      await Share.share({
        message: receiptText,
        title: 'Comprobante de Transferencia ACH'
      });
    } catch (err) {
      Alert.alert('Error', 'No se pudo compartir el comprobante.');
    }
  };

  const activeAccounts = accounts.filter(a => !a.isCard && a.estado === 'Activa');
  const achContacts = contacts.filter(c => c.tipoDestinatario === 'ACH');
  const selectedOriginAccount = accounts.find(a => a.id === originId);

  if (success) {
    return (
      <ScrollView style={styles.successScroll} contentContainerStyle={styles.successScrollContent}>
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <CheckCircle2 size={48} color={COLORS.success} />
            <Text style={styles.receiptTitle}>¡ACH Solicitada!</Text>
            <Text style={styles.receiptSubtitle}>Comprobante de Compensación</Text>
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
              <Text style={styles.receiptLabel}>Banco Destino</Text>
              <Text style={styles.receiptValue}>{banco}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Cuenta Destino Externa</Text>
              <Text style={styles.receiptValue}>{destNumber}</Text>
              <Text style={styles.receiptSubvalue}>{tipoCuenta}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Alias Beneficiario</Text>
              <Text style={styles.receiptValue}>{alias}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Descripción</Text>
              <Text style={styles.receiptValue}>{desc || 'Transferencia ACH'}</Text>
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
          
          <Text style={styles.receiptFooterText}>Banco BIK • Compensación Interbancaria ACH</Text>
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

        <Text style={styles.sectionHeader}>Datos de Destino Interbancario</Text>

        {/* Selector de Destinatarios Guardados (ACH) - Siempre visible */}
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
          <Text style={styles.label}>Banco de Destino *</Text>
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => setShowBankModal(true)}
          >
            <Text style={styles.pickerTriggerText}>{banco || 'Selecciona un banco...'}</Text>
            <ChevronDown size={18} color={COLORS.mediumGray} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Alias del Destinatario *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre o alias del beneficiario"
            value={alias}
            onChangeText={setAlias}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Número de Cuenta Destino *</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 dígitos"
            value={destNumber}
            onChangeText={setDestNumber}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de Cuenta *</Text>
          <View style={styles.selectorRow}>
            {['Monetaria', 'Ahorro'].map((type) => {
              const isSel = tipoCuenta === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.selectorBtn, isSel && styles.selectorActive]}
                  onPress={() => setTipoCuenta(type)}
                >
                  <Text style={[styles.selectorText, isSel && styles.textWhite]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
          <Text style={styles.label}>Descripción o Concepto (Opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Pago servicios profesionales"
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
          style={[styles.transferBtn, (!originId || !destNumber || !alias || !amount || loading) && styles.btnDisabled]}
          onPress={handleTransfer}
          disabled={!originId || !destNumber || !alias || !amount || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.transferBtnText}>Enviar ACH</Text>
              <Send size={18} color={COLORS.white} style={styles.btnIcon} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Bancos */}
      <Modal
        visible={showBankModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Banco</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <X size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {BANCOS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.modalItem, banco === item && styles.modalItemActive]}
                  onPress={() => {
                    setBanco(item);
                    setShowBankModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, banco === item && styles.modalItemTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Contactos ACH */}
      <Modal
        visible={showContactsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContactsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Contacto ACH</Text>
              <TouchableOpacity onPress={() => setShowContactsModal(false)}>
                <X size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {achContacts.length === 0 ? (
                <View style={styles.emptyContactsContainer}>
                  <BookOpen size={48} color={COLORS.mediumGray} />
                  <Text style={styles.emptyContactsText}>No tienes contactos guardados para ACH.</Text>
                  <Text style={styles.emptyContactsSubtext}>Puedes registrar destinatarios desde el Mantenimiento de Cuentas o guardarlos al realizar una transferencia exitosa.</Text>
                </View>
              ) : (
                achContacts.map((contact) => (
                  <TouchableOpacity
                    key={contact._id || contact.id}
                    style={styles.modalItem}
                    onPress={() => handleSelectContact(contact)}
                  >
                    <View style={styles.contactItemDetails}>
                      <Text style={styles.contactName}>{contact.alias}</Text>
                      <Text style={styles.contactAccount}>{contact.numeroCuenta} • {contact.banco} ({contact.tipoCuenta})</Text>
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
    color: COLORS.black,
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
  modalItemActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  modalItemText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  modalItemTextActive: {
    color: COLORS.secondary,
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
