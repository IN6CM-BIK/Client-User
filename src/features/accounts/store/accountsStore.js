import { create } from 'zustand';
import { bikApi } from '../../../shared/api/axiosInstance';
import { useAuthStore } from '../../auth/store/authStore';

/**
 * Almacén de estado global (Zustand) para las cuentas y tarjetas de banca móvil.
 */
export const useAccountsStore = create((set, get) => ({
  accounts: [],
  cards: [],
  recentTransactions: [],
  loading: false,
  error: null,
  loadingTransactions: false,

  /**
   * Carga el resumen de la cuenta consolidada (Dashboard) de forma directa y optimizada.
   */
  fetchDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      const res = await bikApi.get('/accounts/dashboard');
      const { accounts: rawAcc, cards: rawCards, recentTransactions } = res.data.data;

      // Normalizar cuentas
      const accData = (rawAcc || []).map(a => ({
        ...a,
        id: a.publicId || a._id,
        name: a.alias || (a.tipo + (a.moneda === 'USD' ? ' (USD)' : '')),
        number: a.numeroCuenta || 'N/A',
        moneda: a.moneda || 'GTQ',
        isSavings: a.tipo && a.tipo.toLowerCase().includes('ahorro'),
        balance: a.saldo || 0,
        isFavorite: a.isFavorite || false,
        isCard: false,
        blocked: a.saldoBloqueado || 0,
        reserved: a.saldoRetenido || 0,
        estado: a.estado || 'Activa',
        alias: a.alias || '',
        limiteTransferenciaDiario: a.limiteTransferenciaDiario || 5000,
        tipo: a.tipo,
      }));

      // Filtrar y normalizar tarjetas de crédito
      const creditCards = (rawCards || []).filter(c => 
        c.tipo && (c.tipo.toLowerCase().includes('credito') || c.tipo.toLowerCase().includes('crédito'))
      );
      
      const cardData = creditCards.map(c => ({
        ...c,
        id: c.publicId || c._id,
        name: c.tipo || 'Tarjeta de Crédito',
        number: c.numeroTarjeta ? `**** **** **** ${c.numeroTarjeta.slice(-4)}` : 'N/A',
        moneda: 'GTQ',
        balance: c.limiteCredito || 0,
        creditUsed: c.saldoUtilizado || 0,
        creditLimit: c.limiteCredito || 0,
        isFavorite: false,
        isCard: true,
      }));

      const combinedAccounts = [...accData, ...cardData];

      set({
        accounts: combinedAccounts,
        cards: rawCards || [],
        recentTransactions: recentTransactions || [],
        loading: false,
        error: null
      });

      return combinedAccounts;
    } catch (error) {
      console.error('Error cargando datos de dashboard:', error);
      set({ loading: false, error: 'Error al cargar los datos del portal.' });
      return [];
    }
  },

  /**
   * Alterna el estado de favorita de una cuenta de origen.
   */
  toggleFavoriteAccount: async (id, currentFav) => {
    const { accounts } = get();
    set({
      accounts: accounts.map(a => a.id === id ? { ...a, isFavorite: !currentFav } : a)
    });

    try {
      await bikApi.patch(`/accounts/${id}/favorite`);
    } catch (err) {
      console.error('Error al cambiar favorita:', err);
      // Revertir estado si falla
      set({
        accounts: accounts.map(a => a.id === id ? { ...a, isFavorite: currentFav } : a)
      });
    }
  },

  /**
   * Carga el historial transaccional de una cuenta específica.
   */
  fetchAccountTransactions: async (accountId) => {
    set({ loadingTransactions: true });
    try {
      const res = await bikApi.get(`/accounts/${accountId}/transactions`);
      set({ 
        recentTransactions: res.data.data || [], 
        loadingTransactions: false 
      });
    } catch (error) {
      console.error("Error cargando transacciones de cuenta:", error);
      set({ recentTransactions: [], loadingTransactions: false });
    }
  },

  /**
   * Valida una cuenta destino BIK antes de confirmar una transferencia.
   * Retorna nombre del titular si la cuenta existe y está activa.
   */
  validateDestinationAccount: async (numeroCuenta) => {
    try {
      const res = await bikApi.get(`/accounts/validate/${numeroCuenta}`);
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al validar la cuenta destino.';
      throw new Error(msg);
    }
  },

  /**
   * Actualiza el alias personalizado de una cuenta propia.
   */
  updateAccountAlias: async (accountId, alias) => {
    try {
      const res = await bikApi.patch(`/accounts/${accountId}/alias`, { alias });
      const updatedAccount = res.data.data;
      set(state => ({
        accounts: state.accounts.map(a => 
          a.id === accountId 
            ? { ...a, alias: updatedAccount.alias, name: updatedAccount.alias || (a.tipo + (a.moneda === 'USD' ? ' (USD)' : '')) }
            : a
        )
      }));
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al actualizar el alias.';
      throw new Error(msg);
    }
  },

  /**
   * Congela o descongela una cuenta propia por seguridad.
   */
  freezeAccount: async (accountId) => {
    try {
      const res = await bikApi.patch(`/accounts/${accountId}/freeze`);
      const updatedAccount = res.data.data;
      set(state => ({
        accounts: state.accounts.map(a => 
          a.id === accountId 
            ? { ...a, estado: updatedAccount.estado }
            : a
        )
      }));
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al modificar el estado de la cuenta.';
      throw new Error(msg);
    }
  },

  /**
   * Actualiza el límite de transferencia diario de una cuenta propia.
   */
  updateTransferLimit: async (accountId, limiteTransferenciaDiario) => {
    try {
      const res = await bikApi.patch(`/accounts/${accountId}/limits`, { limiteTransferenciaDiario });
      const updatedAccount = res.data.data;
      set(state => ({
        accounts: state.accounts.map(a => 
          a.id === accountId 
            ? { ...a, limiteTransferenciaDiario: updatedAccount.limiteTransferenciaDiario }
            : a
        )
      }));
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al actualizar el límite.';
      throw new Error(msg);
    }
  },

  /**
   * Limpia las transacciones precargadas.
   */
  clearTransactions: () => set({ recentTransactions: [] })
}));
