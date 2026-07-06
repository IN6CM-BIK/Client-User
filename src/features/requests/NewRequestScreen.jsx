import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Send, CheckCircle2 } from 'lucide-react-native';
import { useAccountsStore } from '../accounts/store/accountsStore';
import { bikApi } from '../../shared/api/axiosInstance';
import { COLORS } from '../../shared/constants/colors';
import AlertMessage from '../../shared/components/AlertMessage';

export default function NewRequestScreen({ navigation }) {
  const { accounts, fetchDashboardData } = useAccountsStore();

  const [tipo, setTipo] = useState('Tarjeta de Crédito');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateRequest = async () => {
    if (!desc) {
      Alert.alert('Campos Incompletos', 'Por favor describe tu solicitud.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      tipoGestion: tipo,
      descripcion: desc,
      montoSolicitado: amount ? parseFloat(amount) : null,
      cuentaVinculadaId: linkedAccountId || null
    };

    try {
      const res = await bikApi.post('/requests', payload);
      if (res.data.status === 'success') {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const activeAccounts = accounts.filter(a => !a.isCard && a.estado === 'Activa');
  const tipos = ['Tarjeta de Crédito', 'Tarjeta de Débito', 'Nueva Cuenta Ahorro', 'Nueva Cuenta Monetaria'];

  if (success) {
    return (
      <View style={styles.successContainer}>
        <CheckCircle2 size={64} color={COLORS.success} />
        <Text style={styles.successTitle}>¡Solicitud Registrada!</Text>
        <Text style={styles.successText}>Tu solicitud de producto ha sido ingresada. La administración la revisará a la brevedad.</Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => {
            setSuccess(false);
            setDesc('');
            setAmount('');
            navigation.navigate('Requests');
          }}
        >
          <Text style={styles.doneBtnText}>Ver Mis Solicitudes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Tipo de Producto</Text>

        {error && <AlertMessage message={error} />}

        <View style={styles.selectorRow}>
          {tipos.map((t) => {
            const isSel = tipo === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.selectorBtn, isSel && styles.selectorActive]}
                onPress={() => setTipo(t)}
              >
                <Text style={[styles.selectorText, isSel && styles.textWhite]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionHeader}>Detalles de la Solicitud</Text>

        {tipo === 'Tarjeta de Crédito' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Límite de Crédito Solicitado (Q)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 10000"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>
        )}

        {tipo === 'Tarjeta de Débito' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vincular a Cuenta de Débito Activa</Text>
            {activeAccounts.length === 0 ? (
              <Text style={styles.warningText}>No tienes cuentas activas para vincular.</Text>
            ) : (
              <View style={styles.accountsContainer}>
                {activeAccounts.map((a) => {
                  const isSelected = linkedAccountId === a.id;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.accountOption, isSelected && styles.accountSelected]}
                      onPress={() => setLinkedAccountId(a.id)}
                    >
                      <View style={styles.optionDetails}>
                        <Text style={[styles.optionName, isSelected && styles.textWhite]}>{a.name}</Text>
                        <Text style={[styles.optionNum, isSelected && styles.textBlue]}>{a.number}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción / Justificación *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            placeholder="Describe brevemente el motivo de tu solicitud o añade detalles relevantes."
            value={desc}
            onChangeText={setDesc}
          />
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, (!desc || loading) && styles.btnDisabled]}
          onPress={handleCreateRequest}
          disabled={!desc || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.btnText}>Enviar Solicitud</Text>
              <Send size={18} color={COLORS.white} style={styles.btnIcon} />
            </>
          )}
        </TouchableOpacity>
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
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectorBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: COLORS.lightGray,
  },
  selectorActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkGray,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingVertical: 10,
  },
  actionBtn: {
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
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnIcon: {
    marginLeft: 8,
  },
  accountsContainer: {
    marginTop: 8,
  },
  accountOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  accountSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionDetails: {
    flex: 1,
  },
  optionName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  optionNum: {
    fontSize: 11,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  warningText: {
    color: COLORS.danger,
    fontSize: 13,
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
});
