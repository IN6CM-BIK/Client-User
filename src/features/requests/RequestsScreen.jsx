import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FileText, Plus, AlertCircle } from 'lucide-react-native';
import { bikApi } from '../../shared/api/axiosInstance';
import { COLORS } from '../../shared/constants/colors';
import StatusBadge from '../../shared/components/StatusBadge';

export default function RequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await bikApi.get('/requests');
      setRequests(res.data.data || []);
    } catch (err) {
      console.error('Error fetching requests:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRequests();
    });
    return unsubscribe;
  }, [navigation]);

  const renderRequest = ({ item }) => {
    return (
      <View style={styles.requestCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardType}>{item.tipoGestion}</Text>
            <Text style={styles.cardDate}>
              Solicitado: {new Date(item.fechaSolicitud).toLocaleDateString()}
            </Text>
          </View>
          <StatusBadge status={item.estado} />
        </View>

        <Text style={styles.cardDesc}>{item.descripcion}</Text>

        {item.montoSolicitado > 0 && (
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Monto Solicitado:</Text>
            <Text style={styles.amountValue}>Q{item.montoSolicitado.toFixed(2)}</Text>
          </View>
        )}

        {item.notas && item.notas.length > 0 && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Comentarios de la Administración:</Text>
            {item.notas.map((n, i) => (
              <Text key={i} style={styles.noteText}>• {n.texto}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={48} color={COLORS.mediumGray} />
          <Text style={styles.emptyText}>No tienes solicitudes registradas.</Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('NewRequest')}
          >
            <Plus size={18} color={COLORS.white} style={styles.btnIcon} />
            <Text style={styles.btnText}>Solicitar Producto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.id || item._id}
            contentContainerStyle={styles.listContainer}
          />
          <TouchableOpacity
            style={styles.floatingBtn}
            onPress={() => navigation.navigate('NewRequest')}
          >
            <Plus size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
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
    paddingBottom: 88,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardType: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cardDate: {
    fontSize: 11,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  amountLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  amountValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  notesContainer: {
    marginTop: 12,
    backgroundColor: COLORS.lightGray,
    padding: 10,
    borderRadius: 6,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 11,
    color: COLORS.darkGray,
    lineHeight: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
    padding: 32,
  },
  emptyText: {
    color: COLORS.mediumGray,
    fontSize: 14,
    marginBottom: 20,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 8,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  btnIcon: {
    marginRight: 6,
  },
  floatingBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});
