import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Star, Wallet, CreditCard, ChevronRight } from 'lucide-react-native';
import { useAccountsStore } from './store/accountsStore';
import { COLORS } from '../../shared/constants/colors';

export default function AccountsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('todas');
  const { accounts, loading, fetchDashboardData, toggleFavoriteAccount } = useAccountsStore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleFavorite = (id, currentFav) => {
    toggleFavoriteAccount(id, currentFav);
  };

  const filteredAccounts = accounts.filter((item) => {
    if (activeTab === 'favoritas') return item.isFavorite;
    if (activeTab === 'todas') return !item.isCard;
    if (activeTab === 'tarjetas') return item.isCard;
    return true;
  });

  const renderAccountRow = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.accountCard}
        onPress={() => navigation.navigate('AccountDetail', { accountId: item.id })}
      >
        <View style={styles.iconCol}>
          <View style={[styles.iconBg, item.isCard ? styles.cardIconBg : styles.walletIconBg]}>
            {item.isCard ? (
              <CreditCard size={20} color={COLORS.white} />
            ) : (
              <Wallet size={20} color={COLORS.white} />
            )}
          </View>
        </View>
        
        <View style={styles.detailsCol}>
          <Text style={styles.accountName}>{item.name}</Text>
          <Text style={styles.accountNumber}>{item.number}</Text>
        </View>

        <View style={styles.balanceCol}>
          <Text style={styles.balanceText}>
            {item.moneda === 'USD' ? '$' : 'Q'}{item.isCard ? item.creditUsed.toFixed(2) : item.balance.toFixed(2)}
          </Text>
          <Text style={styles.labelText}>
            {item.isCard ? 'Utilizado' : 'Disponible'}
          </Text>
        </View>

        {!item.isCard && (
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={() => handleToggleFavorite(item.id, item.isFavorite)}
          >
            <Star
              size={20}
              color={item.isFavorite ? COLORS.accent : COLORS.mediumGray}
              fill={item.isFavorite ? COLORS.accent : 'transparent'}
            />
          </TouchableOpacity>
        )}

        <ChevronRight size={20} color={COLORS.mediumGray} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {['Todas', 'Favoritas', 'Tarjetas'].map((tab) => {
          const tabKey = tab.toLowerCase();
          const isActive = activeTab === tabKey;
          return (
            <TouchableOpacity
              key={tabKey}
              style={[styles.tabItem, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tabKey)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : filteredAccounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No se encontraron cuentas.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAccounts}
          renderItem={renderAccountRow}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  listContainer: {
    padding: 16,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  iconCol: {
    marginRight: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIconBg: {
    backgroundColor: COLORS.primary,
  },
  cardIconBg: {
    backgroundColor: COLORS.secondary,
  },
  detailsCol: {
    flex: 1,
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
  balanceCol: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  balanceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  labelText: {
    fontSize: 10,
    color: COLORS.mediumGray,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  favoriteBtn: {
    padding: 6,
    marginRight: 4,
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
});
