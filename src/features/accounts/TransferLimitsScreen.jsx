import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Wallet, ArrowUpDown, Check } from 'lucide-react-native';
import { useAccountsStore } from './store/accountsStore';
import { COLORS } from '../../shared/constants/colors';
import AlertMessage from '../../shared/components/AlertMessage';

/**
 * Pantalla de mantenimiento de límites de transferencia diaria.
 * Permite al usuario modificar el monto máximo que puede transferir por día en cada cuenta.
 */
export default function TransferLimitsScreen({ navigation }) {
  const { accounts, fetchDashboardData, updateTransferLimit } = useAccountsStore();
  const [editingId, setEditingId] = useState(null);
  const [newLimit, setNewLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const bankAccounts = accounts.filter(a => !a.isCard);

  const handleStartEdit = (account) => {
    setEditingId(account.id);
    setNewLimit(account.limiteTransferenciaDiario.toString());
    setError('');
    setSuccessMsg('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewLimit('');
  };

  const handleSaveLimit = async (accountId) => {
    const numericLimit = parseFloat(newLimit);
    if (isNaN(numericLimit) || numericLimit <= 0) {
      setError('El límite debe ser un número positivo.');
      return;
    }

    if (numericLimit > 100000) {
      setError('El límite máximo permitido es Q100,000.00.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateTransferLimit(accountId, numericLimit);
      setEditingId(null);
      setNewLimit('');
      setSuccessMsg('Límite actualizado correctamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Límites de Transferencia</Text>
      <Text style={styles.subtitle}>
        Configura el monto máximo que puedes transferir diariamente desde cada una de tus cuentas.
      </Text>

      {error !== '' && <AlertMessage message={error} />}
      {successMsg !== '' && <AlertMessage message={successMsg} type="success" />}

      {bankAccounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tienes cuentas registradas.</Text>
        </View>
      ) : (
        bankAccounts.map((account) => {
          const isEditing = editingId === account.id;

          return (
            <View style={styles.accountCard} key={account.id}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconBg}>
                    <Wallet size={20} color={COLORS.white} />
                  </View>
                  <View>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountNumber}>{account.number}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.limitSection}>
                <View style={styles.limitIconRow}>
                  <ArrowUpDown size={16} color={COLORS.primary} />
                  <Text style={styles.limitLabel}>Límite Diario de Transferencias</Text>
                </View>

                {isEditing ? (
                  <View style={styles.editRow}>
                    <Text style={styles.currencyPrefix}>Q</Text>
                    <TextInput
                      style={styles.limitInput}
                      value={newLimit}
                      onChangeText={setNewLimit}
                      keyboardType="decimal-pad"
                      autoFocus
                      placeholder="0.00"
                    />
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={() => handleSaveLimit(account.id)}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Check size={18} color={COLORS.white} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={handleCancelEdit}
                    >
                      <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.displayRow}>
                    <Text style={styles.limitValue}>
                      Q{account.limiteTransferenciaDiario.toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      style={styles.modifyBtn}
                      onPress={() => handleStartEdit(account)}
                    >
                      <Text style={styles.modifyText}>Modificar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Text style={styles.infoText}>
                  Este es el monto máximo acumulado que podrás transferir en un solo día calendario desde esta cuenta.
                </Text>
              </View>
            </View>
          );
        })
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>ℹ️ Información importante</Text>
        <Text style={styles.infoCardText}>
          • El límite máximo permitido es de Q100,000.00 por día.{'\n'}
          • Los cambios aplican de forma inmediata.{'\n'}
          • Los depósitos en ventanilla no cuentan contra este límite.{'\n'}
          • Si necesitas un límite mayor, acude a una agencia BIK.
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
    paddingBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
  },
  emptyText: {
    color: COLORS.mediumGray,
    fontSize: 14,
  },
  accountCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  accountNumber: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  limitSection: {},
  limitIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  limitLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  displayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  modifyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modifyText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  limitInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  saveBtn: {
    backgroundColor: COLORS.success,
    width: 44,
    height: 44,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 8,
  },
  cancelText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 11,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 12,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
});
