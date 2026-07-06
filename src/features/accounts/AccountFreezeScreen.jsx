import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Wallet, Shield, ShieldOff, ShieldAlert } from 'lucide-react-native';
import { useAccountsStore } from './store/accountsStore';
import { COLORS } from '../../shared/constants/colors';
import AlertMessage from '../../shared/components/AlertMessage';

/**
 * Pantalla para congelar y descongelar las cuentas propias del usuario.
 */
export default function AccountFreezeScreen({ navigation }) {
  const { accounts, fetchDashboardData, freezeAccount, loading } = useAccountsStore();
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const bankAccounts = accounts.filter(a => !a.isCard);

  const handleToggleFreeze = async (account) => {
    const action = account.estado === 'Congelada' ? 'descongelar' : 'congelar';
    Alert.alert(
      `Confirmar ${action}`,
      `¿Estás seguro de que deseas ${action} la cuenta ${account.number}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: account.estado === 'Congelada' ? 'default' : 'destructive',
          onPress: async () => {
            setUpdatingId(account.id);
            setError('');
            setSuccessMsg('');
            try {
              await freezeAccount(account.id);
              setSuccessMsg(`Cuenta ${action === 'congelar' ? 'congelada' : 'descongelada'} exitosamente.`);
              setTimeout(() => setSuccessMsg(''), 3000);
            } catch (err) {
              setError(err.message);
            } finally {
              setUpdatingId(null);
            }
          }
        }
      ]
    );
  };

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'Activa': return { bg: '#ECFDF5', text: COLORS.success };
      case 'Congelada': return { bg: '#DBEAFE', text: COLORS.primary };
      case 'Bloqueada': return { bg: '#FEF2F2', text: COLORS.danger };
      case 'Cancelada': return { bg: '#F3F4F6', text: COLORS.mediumGray };
      default: return { bg: '#F3F4F6', text: COLORS.mediumGray };
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Bloqueo de Cuentas</Text>
      <Text style={styles.subtitle}>
        Congela temporalmente tus cuentas bancarias para bloquear retiros y transferencias salientes por seguridad.
      </Text>

      {error !== '' && <AlertMessage message={error} />}
      {successMsg !== '' && <AlertMessage message={successMsg} type="success" />}

      {loading && !updatingId ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
      ) : bankAccounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShieldAlert size={48} color={COLORS.mediumGray} />
          <Text style={styles.emptyText}>No tienes cuentas bancarias registradas.</Text>
        </View>
      ) : (
        bankAccounts.map((account) => {
          const estadoStyle = getEstadoStyle(account.estado);
          const isUpdating = updatingId === account.id;
          const canFreeze = account.estado === 'Activa' || account.estado === 'Congelada';

          return (
            <View style={styles.accountCard} key={account.id}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconBg}>
                    <Wallet size={20} color={COLORS.white} />
                  </View>
                  <View style={styles.headerTextCol}>
                    <Text style={styles.accountType}>{account.tipo} • {account.moneda}</Text>
                    <Text style={styles.accountNumber}>{account.number}</Text>
                  </View>
                </View>
                <View style={[styles.estadoBadge, { backgroundColor: estadoStyle.bg }]}>
                  <Text style={[styles.estadoText, { color: estadoStyle.text }]}>{account.estado}</Text>
                </View>
              </View>

              {account.alias ? (
                <View style={styles.aliasRow}>
                  <Text style={styles.aliasLabel}>Alias: </Text>
                  <Text style={styles.aliasValue}>{account.alias}</Text>
                </View>
              ) : null}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Saldo Disponible</Text>
                <Text style={styles.detailValue}>
                  {account.moneda === 'USD' ? '$' : 'Q'}{account.balance.toFixed(2)}
                </Text>
              </View>

              {canFreeze ? (
                <TouchableOpacity
                  style={[
                    styles.freezeBtn,
                    account.estado === 'Congelada' ? styles.unfreezeBtn : styles.freezeBtnDanger
                  ]}
                  onPress={() => handleToggleFreeze(account)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color={account.estado === 'Congelada' ? COLORS.success : COLORS.danger} />
                  ) : account.estado === 'Congelada' ? (
                    <>
                      <Shield size={18} color={COLORS.success} style={styles.freezeIcon} />
                      <Text style={[styles.freezeText, { color: COLORS.success }]}>Descongelar Cuenta</Text>
                    </>
                  ) : (
                    <>
                      <ShieldOff size={18} color={COLORS.danger} style={styles.freezeIcon} />
                      <Text style={[styles.freezeText, { color: COLORS.danger }]}>Congelar Cuenta</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.statusInfoBox}>
                  <Text style={styles.statusInfoText}>
                    Esta cuenta se encuentra bloqueada o cancelada y no admite cambios de estado temporales.
                  </Text>
                </View>
              )}
            </View>
          );
        })
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginBottom: 20,
    lineHeight: 18,
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTextCol: {
    flex: 1,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  accountNumber: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  aliasRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  aliasLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: 'bold',
  },
  aliasValue: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  freezeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
  },
  freezeBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  unfreezeBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  freezeIcon: {
    marginRight: 8,
  },
  freezeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusInfoBox: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  statusInfoText: {
    fontSize: 11,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
});
