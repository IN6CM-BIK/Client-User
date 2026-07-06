import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { BookUser, Pencil, Trash2, Check, X, Search, Globe, Landmark, Plus, ChevronDown } from 'lucide-react-native';
import { useContactsStore } from './store/contactsStore';
import { COLORS } from '../../shared/constants/colors';
import AlertMessage from '../../shared/components/AlertMessage';

/**
 * Pantalla de mantenimiento de destinatarios (contactos guardados).
 * Permite listar, crear, editar alias y eliminar cuentas guardadas (Terceros BIK y ACH).
 */
export default function AccountMaintenanceScreen({ navigation }) {
  const { contacts, fetchContacts, addContact, updateContact, deleteContact, loading } = useContactsStore();
  
  // Estados para búsqueda y edición
  const [editingId, setEditingId] = useState(null);
  const [aliasValue, setAliasValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados para agregar nuevo contacto
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTipo, setNewTipo] = useState('BIK'); // BIK o ACH
  const [newAlias, setNewAlias] = useState('');
  const [newCuenta, setNewCuenta] = useState('');
  const [newBanco, setNewBanco] = useState('Banco Industrial');
  const [newTipoCuenta, setNewTipoCuenta] = useState('Monetaria');
  const [showBankPicker, setShowBankPicker] = useState(false);

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
    fetchContacts();
  }, []);

  const handleStartEdit = (contact) => {
    setEditingId(contact._id || contact.id);
    setAliasValue(contact.alias);
    setError('');
    setSuccessMsg('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAliasValue('');
  };

  const handleSaveAlias = async (contactId) => {
    if (!aliasValue.trim()) {
      setError('El alias no puede estar vacío.');
      return;
    }

    setUpdatingId(contactId);
    setError('');
    setSuccessMsg('');
    try {
      await updateContact(contactId, { alias: aliasValue });
      setEditingId(null);
      setSuccessMsg('Alias de destinatario actualizado.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al actualizar el alias.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteContact = (contact) => {
    Alert.alert(
      'Eliminar Destinatario',
      `¿Estás seguro de que deseas eliminar a "${contact.alias}" de tu libreta de contactos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const contactId = contact._id || contact.id;
            setUpdatingId(contactId);
            setError('');
            setSuccessMsg('');
            try {
              await deleteContact(contactId);
              setSuccessMsg('Destinatario eliminado de tus contactos.');
              setTimeout(() => setSuccessMsg(''), 3000);
            } catch (err) {
              setError(err.message || 'Error al eliminar destinatario.');
            } finally {
              setUpdatingId(null);
            }
          }
        }
      ]
    );
  };

  const handleCreateContact = async () => {
    if (!newAlias.trim() || !newCuenta.trim()) {
      Alert.alert('Campos Incompletos', 'Por favor ingresa un alias y número de cuenta.');
      return;
    }

    if (newCuenta.length < 6) {
      Alert.alert('Cuenta Corta', 'El número de cuenta debe tener al menos 6 dígitos.');
      return;
    }

    setUpdatingId('new');
    try {
      const payload = {
        alias: newAlias,
        tipoDestinatario: newTipo,
        numeroCuenta: newCuenta,
        tipoCuenta: newTipoCuenta,
        banco: newTipo === 'BIK' ? 'BIK' : newBanco
      };
      await addContact(payload);
      
      // Resetear formulario
      setNewAlias('');
      setNewCuenta('');
      setNewTipo('BIK');
      setNewTipoCuenta('Monetaria');
      setNewBanco('Banco Industrial');
      setShowAddModal(false);

      setSuccessMsg('Destinatario guardado exitosamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo registrar el contacto.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.numeroCuenta.includes(searchQuery) ||
    c.banco.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Libreta de Destinatarios</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Plus size={18} color={COLORS.white} />
            <Text style={styles.addBtnText}>Nuevo</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Administra las cuentas guardadas para transferencias rápidas a terceros BIK y otros bancos (ACH).
        </Text>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.mediumGray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, banco o número..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {error !== '' && <AlertMessage message={error} />}
        {successMsg !== '' && <AlertMessage message={successMsg} type="success" />}

        {loading && updatingId !== 'new' && !updatingId ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
        ) : filteredContacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BookUser size={48} color={COLORS.mediumGray} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron destinatarios.' : 'No tienes destinatarios guardados.'}
            </Text>
          </View>
        ) : (
          filteredContacts.map((contact) => {
            const contactId = contact._id || contact.id;
            const isEditing = editingId === contactId;
            const isUpdating = updatingId === contactId;
            const isBIK = contact.tipoDestinatario === 'BIK';

            return (
              <View key={contactId} style={styles.contactCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.contactInfo}>
                    <View style={[styles.avatarBg, isBIK ? styles.avatarBIK : styles.avatarACH]}>
                      {isBIK ? (
                        <Globe size={18} color={COLORS.white} />
                      ) : (
                        <Landmark size={18} color={COLORS.white} />
                      )}
                    </View>
                    <View style={styles.textCol}>
                      {isEditing ? (
                        <View style={styles.editRow}>
                          <TextInput
                            style={styles.aliasInput}
                            value={aliasValue}
                            onChangeText={setAliasValue}
                            maxLength={50}
                            autoFocus
                          />
                          <TouchableOpacity
                            style={styles.actionIconBtn}
                            onPress={() => handleSaveAlias(contactId)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <ActivityIndicator size="small" color={COLORS.success} />
                            ) : (
                              <Check size={18} color={COLORS.success} />
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.actionIconBtn} onPress={handleCancelEdit}>
                            <X size={18} color={COLORS.danger} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.aliasDisplayRow}>
                          <Text style={styles.aliasName} numberOfLines={1}>{contact.alias}</Text>
                          <TouchableOpacity
                            style={styles.smallEditBtn}
                            onPress={() => handleStartEdit(contact)}
                          >
                            <Pencil size={12} color={COLORS.primary} />
                          </TouchableOpacity>
                        </View>
                      )}
                      <Text style={styles.contactDetails}>
                        {contact.numeroCuenta} • {contact.banco} ({contact.tipoCuenta})
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteContact(contact)}
                      disabled={isUpdating}
                    >
                      <Trash2 size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal para Crear Nuevo Destinatario */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Destinatario</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContainer}>
              <Text style={styles.label}>Tipo de Destinatario</Text>
              <View style={styles.selectorRow}>
                {['BIK', 'ACH'].map((type) => {
                  const active = newTipo === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.selectorBtn, active && styles.selectorActive]}
                      onPress={() => setNewTipo(type)}
                    >
                      <Text style={[styles.selectorText, active && styles.textWhite]}>
                        {type === 'BIK' ? 'Tercero BIK' : 'Otro Banco (ACH)'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Alias o Nombre del Titular *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Juan Pérez"
                value={newAlias}
                onChangeText={setNewAlias}
              />

              <Text style={styles.label}>Número de Cuenta *</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 dígitos"
                value={newCuenta}
                onChangeText={setNewCuenta}
                keyboardType="number-pad"
              />

              {newTipo === 'ACH' && (
                <>
                  <Text style={styles.label}>Banco de Destino *</Text>
                  <TouchableOpacity
                    style={styles.pickerTrigger}
                    onPress={() => setShowBankPicker(true)}
                  >
                    <Text style={styles.pickerTriggerText}>{newBanco}</Text>
                    <ChevronDown size={18} color={COLORS.mediumGray} />
                  </TouchableOpacity>
                </>
              )}

              <Text style={styles.label}>Tipo de Cuenta</Text>
              <View style={styles.selectorRow}>
                {['Monetaria', 'Ahorro'].map((type) => {
                  const active = newTipoCuenta === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.selectorBtn, active && styles.selectorActive]}
                      onPress={() => setNewTipoCuenta(type)}
                    >
                      <Text style={[styles.selectorText, active && styles.textWhite]}>{type}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.saveContactBtn, updatingId === 'new' && styles.btnDisabled]}
                onPress={handleCreateContact}
                disabled={updatingId === 'new'}
              >
                {updatingId === 'new' ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveContactBtnText}>Registrar Destinatario</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal para Seleccionar Banco */}
      <Modal
        visible={showBankPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBankPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Banco</Text>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <X size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {BANCOS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.modalItem, newBanco === item && styles.modalItemActive]}
                  onPress={() => {
                    setNewBanco(item);
                    setShowBankPicker(false);
                  }}
                >
                  <Text style={[styles.modalItemText, newBanco === item && styles.modalItemTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerArea: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.darkGray,
    lineHeight: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
  },
  emptyText: {
    color: COLORS.mediumGray,
    fontSize: 14,
    marginTop: 12,
  },
  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBIK: {
    backgroundColor: COLORS.primary,
  },
  avatarACH: {
    backgroundColor: COLORS.secondary,
  },
  textCol: {
    flex: 1,
  },
  aliasDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aliasName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    maxWidth: '80%',
  },
  smallEditBtn: {
    padding: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aliasInput: {
    flex: 1,
    height: 32,
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    fontSize: 13,
    backgroundColor: COLORS.lightGray,
    color: COLORS.black,
  },
  actionIconBtn: {
    padding: 4,
  },
  contactDetails: {
    fontSize: 11,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  cardActions: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
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
  formContainer: {
    paddingBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 14,
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
  textWhite: {
    color: COLORS.white,
  },
  pickerTrigger: {
    height: 44,
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerTriggerText: {
    fontSize: 14,
    color: COLORS.black,
  },
  saveContactBtn: {
    backgroundColor: COLORS.secondary,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveContactBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnDisabled: {
    backgroundColor: COLORS.mediumGray,
  },
});
