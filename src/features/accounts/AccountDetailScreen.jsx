import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Wallet, Star, CreditCard, ArrowUpRight, ArrowLeftRight } from 'lucide-react-native';
import { useAccountsStore } from './store/accountsStore';
import { COLORS } from '../../shared/constants/colors';

export default function AccountDetailScreen({ route, navigation }) {
  const { accountId } = route.params;
  const { accounts, recentTransactions, loadingTransactions, fetchAccountTransactions, toggleFavoriteAccount, clearTransactions } = useAccountsStore();

  const account = accounts.find((a) => a.id === accountId);

  useEffect(() => {
    if (account && account.isCard) {
      clearTransactions();
    } else {
      fetchAccountTransactions(accountId);
    }
  }, [accountId, account]);

  if (!account) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se encontró la cuenta seleccionada.</Text>
      </View>
    );
  }

  const renderTransactionItem = (item) => {
    const isDest = item.cuentaDestinoId && (
      (typeof item.cuentaDestinoId === 'string' && item.cuentaDestinoId === account.id) ||
      (typeof item.cuentaDestinoId === 'object' && (item.cuentaDestinoId._id === account._id || item.cuentaDestinoId.publicId === account.publicId || item.cuentaDestinoId.id === account.id))
    );
    const isCredit = isDest || item.tipo === 'Deposito_Efectivo' || item.tipo === 'Remesa' || item.descripcion?.includes('recibida') || item.descripcion?.includes('Abono');
    const symbol = account.moneda === 'USD' ? '$' : 'Q';
    const amountToShow = isCredit && (item.montoAcreditado !== undefined && item.montoAcreditado !== null) ? item.montoAcreditado : item.monto;

    return (
      <View style={styles.txRow} key={item._id || item.id}>
        <View style={styles.txIconBg}>
          <ArrowUpRight
            size={18}
            color={isCredit ? COLORS.success : COLORS.danger}
            style={{ transform: [{ rotate: isCredit ? '180deg' : '0deg' }] }}
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txDesc} numberOfLines={1}>{item.descripcion || item.tipo}</Text>
          <Text style={styles.txDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <Text style={[styles.txVal, { color: isCredit ? COLORS.success : COLORS.danger }]}>
          {isCredit ? '+' : '-'} {symbol}{amountToShow.toFixed(2)}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.detailCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <View style={[styles.typeIconBg, account.isCard ? styles.cardBg : styles.walletBg]}>
              {account.isCard ? (
                <CreditCard size={24} color={COLORS.white} />
              ) : (
                <Wallet size={24} color={COLORS.white} />
              )}
            </View>
            <View>
              <Text style={styles.typeName}>{account.name}</Text>
              <Text style={styles.numberText}>{account.number}</Text>
            </View>
          </View>
          {!account.isCard && (
            <TouchableOpacity onPress={() => toggleFavoriteAccount(account.id, account.isFavorite)}>
              <Star
                size={24}
                color={account.isFavorite ? COLORS.accent : COLORS.mediumGray}
                fill={account.isFavorite ? COLORS.accent : 'transparent'}
              />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.balanceLabel}>SALDO DISPONIBLE</Text>
        <Text style={styles.balanceText}>
          {account.moneda === 'USD' ? '$' : 'Q'}{account.isCard ? account.creditLimit.toFixed(2) : account.balance.toFixed(2)}
        </Text>

        {account.isCard ? (
          <View style={styles.extraRows}>
            <View style={styles.extraCol}>
              <Text style={styles.extraLabel}>SALDO UTILIZADO</Text>
              <Text style={styles.extraVal}>Q{account.creditUsed.toFixed(2)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.extraRows}>
            <View style={styles.extraCol}>
              <Text style={styles.extraLabel}>RETENIDO</Text>
              <Text style={styles.extraVal}>Q{account.reserved.toFixed(2)}</Text>
            </View>
            <View style={styles.extraCol}>
              <Text style={styles.extraLabel}>BLOQUEADO</Text>
              <Text style={styles.extraVal}>Q{account.blocked.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate('Main', { screen: 'Transferir' })}
      >
        <ArrowLeftRight size={20} color={COLORS.white} style={styles.actionIcon} />
        <Text style={styles.actionBtnText}>Realizar Transferencia</Text>
      </TouchableOpacity>

      <Text style={styles.historyHeader}>
        {account.isCard ? 'Movimientos de la tarjeta' : 'Movimientos de la cuenta'}
      </Text>
      
      <View style={styles.txCard}>
        {loadingTransactions ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : recentTransactions.length === 0 ? (
          <Text style={styles.noTxText}>
            {account.isCard ? 'No hay movimientos de tarjeta registrados.' : 'No hay transacciones registradas en esta cuenta.'}
          </Text>
        ) : (
          recentTransactions.map(renderTransactionItem)
        )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletBg: {
    backgroundColor: COLORS.primary,
  },
  cardBg: {
    backgroundColor: COLORS.secondary,
  },
  typeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  numberText: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mediumGray,
    letterSpacing: 1.5,
  },
  balanceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 4,
    marginBottom: 20,
  },
  extraRows: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 16,
    gap: 24,
  },
  extraCol: {
    flex: 1,
  },
  extraLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.mediumGray,
  },
  extraVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  txCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  txIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  txDate: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  txVal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noTxText: {
    textAlign: 'center',
    color: COLORS.mediumGray,
    paddingVertical: 16,
  },
});
