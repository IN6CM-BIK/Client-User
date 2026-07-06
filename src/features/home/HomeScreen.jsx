import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { Wallet, CreditCard, ArrowUpRight, QrCode, Sparkles, Bell, HelpCircle } from 'lucide-react-native';
import { useAuthStore } from '../auth/store/authStore';
import { useAccountsStore } from '../accounts/store/accountsStore';
import { COLORS } from '../../shared/constants/colors';
import StatusBadge from '../../shared/components/StatusBadge';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { accounts, loading, fetchDashboardData, recentTransactions } = useAccountsStore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const renderCard = ({ item }) => {
    const isCredit = item.isCard;
    return (
      <TouchableOpacity
        style={[styles.bankCard, isCredit ? styles.creditCardBg : styles.debitCardBg]}
        onPress={() => navigation.navigate('AccountDetail', { accountId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTypeName}>{item.name}</Text>
          {isCredit ? (
            <CreditCard size={24} color={COLORS.white} />
          ) : (
            <Wallet size={24} color={COLORS.white} />
          )}
        </View>
        <Text style={styles.cardNumber}>{item.number}</Text>
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardLabel}>{isCredit ? 'SALDO UTILIZADO' : 'DISPONIBLE'}</Text>
            <Text style={styles.cardBalance}>
              {item.moneda === 'USD' ? '$' : 'Q'}{isCredit ? item.creditUsed.toFixed(2) : item.balance.toFixed(2)}
            </Text>
          </View>
          {isCredit && (
            <View>
              <Text style={styles.cardLabel}>LÍMITE</Text>
              <Text style={styles.cardLimit}>Q{item.creditLimit.toFixed(2)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTransaction = ({ item }) => {
    // Determinar si es abono o cargo para el usuario
    const myAccountIds = accounts.map(a => a.id);
    const isDestMine = item.cuentaDestinoId && (
      (typeof item.cuentaDestinoId === 'string' && myAccountIds.includes(item.cuentaDestinoId)) ||
      (typeof item.cuentaDestinoId === 'object' && (myAccountIds.includes(item.cuentaDestinoId._id) || myAccountIds.includes(item.cuentaDestinoId.publicId) || myAccountIds.includes(item.cuentaDestinoId.id)))
    );
    const isCredit = isDestMine || item.tipo === 'Deposito_Efectivo' || item.tipo === 'Remesa' || item.descripcion?.includes('recibida') || item.descripcion?.includes('Abono');

    // Determinar la cuenta de referencia (para el símbolo de moneda)
    const targetAccountId = isDestMine 
      ? (item.cuentaDestinoId?.id || item.cuentaDestinoId?._id || item.cuentaDestinoId) 
      : (item.cuentaOrigenId?.id || item.cuentaOrigenId?._id || item.cuentaOrigenId);
    const targetAccount = accounts.find(a => a.id === targetAccountId);
    const symbol = targetAccount?.moneda === 'USD' ? '$' : 'Q';
    
    const amountToShow = isCredit && (item.montoAcreditado !== undefined && item.montoAcreditado !== null) ? item.montoAcreditado : item.monto;

    return (
      <View style={styles.txRow}>
        <View style={styles.txIconContainer}>
          <ArrowUpRight
            size={18}
            color={isCredit ? COLORS.success : COLORS.danger}
            style={{ transform: [{ rotate: isCredit ? '180deg' : '0deg' }] }}
          />
        </View>
        <View style={styles.txDetails}>
          <Text style={styles.txDescription} numberOfLines={1}>
            {item.descripcion || item.tipo}
          </Text>
          <Text style={styles.txDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.txAmount, { color: isCredit ? COLORS.success : COLORS.danger }]}>
          {isCredit ? '+' : '-'} {symbol}{amountToShow.toFixed(2)}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.welcomeBanner}>
        <View>
          <Text style={styles.greeting}>Hola,</Text>
          <Text style={styles.userName}>{user?.nombres || 'Cliente BIK'}</Text>
        </View>
        <View style={styles.badgeRow}>
          <StatusBadge status={user?.estado || 'Activo'} />
          <TouchableOpacity 
            style={styles.notificationBtn} 
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Mis Productos Financieros</Text>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 32 }} />
      ) : accounts.length === 0 ? (
        <View style={styles.emptyProducts}>
          <Text style={styles.emptyText}>No tienes cuentas o tarjetas registradas.</Text>
        </View>
      ) : (
        <FlatList
          data={accounts}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width * 0.85 + 16}
          decelerationRate="fast"
          contentContainerStyle={styles.cardsList}
        />
      )}

      <Text style={styles.sectionHeader}>Operaciones Rápidas</Text>
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => navigation.navigate('Transferir')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: '#DBEAFE' }]}>
            <ArrowUpRight size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.actionText}>Transferir</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => navigation.navigate('QrPay')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: '#FEE2E2' }]}>
            <QrCode size={24} color={COLORS.danger} />
          </View>
          <Text style={styles.actionText}>Cobro QR</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => navigation.navigate('Payments')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: '#FEF3C7' }]}>
            <Sparkles size={24} color={COLORS.accent} />
          </View>
          <Text style={styles.actionText}>Servicios</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => navigation.navigate('Cards')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: '#D1FAE5' }]}>
            <CreditCard size={24} color={COLORS.success} />
          </View>
          <Text style={styles.actionText}>Tarjetas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.txHeaderRow}>
        <Text style={styles.sectionHeader}>Movimientos Recientes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cuentas')}>
          <Text style={styles.viewMore}>Ver todo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.txCard}>
        {recentTransactions.length === 0 ? (
          <Text style={styles.noTxText}>No hay transacciones registradas recientemente.</Text>
        ) : (
          recentTransactions.slice(0, 5).map((item) => (
            <React.Fragment key={item._id || item.id}>
              {renderTransaction({ item })}
            </React.Fragment>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  welcomeBanner: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  greeting: {
    fontSize: 14,
    color: '#93C5FD',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 8,
    borderRadius: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  cardsList: {
    paddingHorizontal: 16,
  },
  bankCard: {
    width: width * 0.82,
    height: 180,
    borderRadius: 16,
    padding: 20,
    marginRight: 12,
    justifyContent: 'space-between',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  debitCardBg: {
    backgroundColor: '#1E40AF', // Blue 800
  },
  creditCardBg: {
    backgroundColor: '#4B5563', // Gray 600
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTypeName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardNumber: {
    color: COLORS.white,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    letterSpacing: 2,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBalance: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  cardLimit: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  emptyProducts: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.mediumGray,
    fontSize: 14,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  actionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginRight: 16,
  },
  viewMore: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  txCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
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
  txIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  txDate: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noTxText: {
    textAlign: 'center',
    color: COLORS.mediumGray,
    paddingVertical: 16,
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
