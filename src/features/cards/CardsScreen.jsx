import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { CreditCard, Eye, EyeOff, ShieldAlert } from 'lucide-react-native';
import { useAccountsStore } from '../accounts/store/accountsStore';
import { bikApi } from '../../shared/api/axiosInstance';
import { COLORS } from '../../shared/constants/colors';

export default function CardsScreen() {
  const { cards: initialCards, fetchDashboardData, loading } = useAccountsStore();
  const [cards, setCards] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    setCards(initialCards || []);
  }, [initialCards]);

  const handleToggleFreeze = async (cardId, currentFreeze) => {
    setUpdatingId(cardId);
    try {
      const res = await bikApi.patch(`/cards/${cardId}/freeze`);
      if (res.data.status === 'success') {
        setCards(cards.map(c => c.id === cardId || c._id === cardId ? {
          ...c,
          configuraciones: {
            ...c.configuraciones,
            bloqueada: !currentFreeze
          }
        } : c));
        Alert.alert('Estado Actualizado', res.data.message || 'Estado de la tarjeta modificado.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo cambiar el estado de la tarjeta.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleIntl = async (cardId, currentIntl) => {
    setUpdatingId(cardId);
    try {
      const res = await bikApi.patch(`/cards/${cardId}/config`, {
        comprasInternacionales: !currentIntl
      });
      if (res.data.status === 'success') {
        setCards(cards.map(c => c.id === cardId || c._id === cardId ? {
          ...c,
          configuraciones: {
            ...c.configuraciones,
            comprasInternacionales: !currentIntl
          }
        } : c));
        Alert.alert('Configuración Guardada', 'Se ha guardado la preferencia de compras internacionales.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo actualizar la configuración.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Mis Tarjetas de Débito y Crédito</Text>
      <Text style={styles.subtitle}>Administra los bloqueos temporales y límites operativos de tus plásticos.</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
      ) : cards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShieldAlert size={48} color={COLORS.mediumGray} />
          <Text style={styles.emptyText}>No tienes tarjetas activas vinculadas a tu cuenta.</Text>
        </View>
      ) : (
        cards.map((card) => {
          const isLocked = card.configuraciones?.bloqueada || false;
          const isIntl = card.configuraciones?.comprasInternacionales || false;
          const isUpdating = updatingId === (card.id || card._id);
          
          return (
            <View key={card.id || card._id} style={[styles.cardContainer, isLocked && styles.cardLocked]}>
              <View style={[styles.visualCard, card.tipo.includes('Credito') ? styles.creditBg : styles.debitBg]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardType}>{card.tipo.toUpperCase()}</Text>
                  <CreditCard size={24} color={COLORS.white} />
                </View>
                <Text style={styles.cardNumber}>
                  **** **** **** {card.numeroTarjeta.slice(-4)}
                </Text>
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.label}>EXPIRACIÓN</Text>
                    <Text style={styles.value}>{card.fechaExpiracion}</Text>
                  </View>
                  <View>
                    <Text style={styles.label}>CVV</Text>
                    <Text style={styles.value}>***</Text>
                  </View>
                </View>
              </View>

              <View style={styles.settingsPanel}>
                <View style={styles.settingRow}>
                  <View>
                    <Text style={styles.settingTitle}>Bloqueo Temporal</Text>
                    <Text style={styles.settingDesc}>Apaga o enciende tu tarjeta en cualquier momento.</Text>
                  </View>
                  <Switch
                    value={isLocked}
                    onValueChange={() => handleToggleFreeze(card.id || card._id, isLocked)}
                    disabled={isUpdating}
                    thumbColor={isLocked ? COLORS.secondary : '#f4f3f4'}
                    trackColor={{ false: '#767577', true: '#ffedd5' }}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View>
                    <Text style={styles.settingTitle}>Compras Internacionales</Text>
                    <Text style={styles.settingDesc}>Permite transacciones fuera del territorio nacional.</Text>
                  </View>
                  <Switch
                    value={isIntl}
                    onValueChange={() => handleToggleIntl(card.id || card._id, isIntl)}
                    disabled={isUpdating}
                    thumbColor={isIntl ? COLORS.primary : '#f4f3f4'}
                    trackColor={{ false: '#767577', true: '#dbeafe' }}
                  />
                </View>
              </View>
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
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  cardLocked: {
    opacity: 0.75,
  },
  visualCard: {
    height: 160,
    padding: 20,
    justifyContent: 'space-between',
  },
  debitBg: {
    backgroundColor: '#1E3A8A', // Blue 900
  },
  creditBg: {
    backgroundColor: '#374151', // Gray 700
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardType: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  cardNumber: {
    color: COLORS.white,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    letterSpacing: 2,
    textAlign: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#9CA3AF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  value: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  settingsPanel: {
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  settingDesc: {
    fontSize: 11,
    color: COLORS.mediumGray,
    marginTop: 2,
    maxWidth: 240,
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
    textAlign: 'center',
  },
});
