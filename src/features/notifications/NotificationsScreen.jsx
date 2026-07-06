import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Bell, BellOff, Check } from 'lucide-react-native';
import { bikApi } from '../../shared/api/axiosInstance';
import { COLORS } from '../../shared/constants/colors';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await bikApi.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await bikApi.patch(`/notifications/${id}/read`);
      if (res.data.status === 'success') {
        setNotifications(notifications.map(n => n._id === id ? { ...n, leido: true } : n));
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo marcar la notificación como leída.');
    }
  };

  const renderNotification = ({ item }) => {
    const isUnread = !item.leido;
    return (
      <TouchableOpacity
        style={[styles.notificationCard, isUnread && styles.unreadCard]}
        onPress={() => isUnread && handleMarkAsRead(item._id)}
        disabled={!isUnread}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, isUnread && styles.boldText]}>
            {item.titulo || 'Notificación BIK'}
          </Text>
          {isUnread && (
            <View style={styles.unreadDot} />
          )}
        </View>
        <Text style={styles.cardMsg}>{item.mensaje}</Text>
        <Text style={styles.cardDate}>
          {new Date(item.fecha || item.createdAt).toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BellOff size={48} color={COLORS.mediumGray} />
          <Text style={styles.emptyText}>No tienes notificaciones pendientes.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
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
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.mediumGray,
  },
  unreadCard: {
    borderLeftColor: COLORS.secondary,
    backgroundColor: '#EFF6FF', // Light blue background for unread
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  boldText: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  cardMsg: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 11,
    color: COLORS.mediumGray,
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
});
