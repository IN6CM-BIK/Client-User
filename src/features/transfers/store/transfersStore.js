import { create } from 'zustand';
import { bikApi } from '../../../shared/api/axiosInstance';
import { useAccountsStore } from '../../accounts/store/accountsStore';

/**
 * Almacén global de transferencias y transacciones.
 */
export const useTransfersStore = create((set) => ({
  loading: false,
  error: null,
  success: false,

  /**
   * Ejecuta una transferencia entre cuentas internas BIK.
   */
  transferInternal: async (data, idempotencyKey) => {
    set({ loading: true, error: null, success: false });
    try {
      const headers = {};
      if (idempotencyKey) {
        headers['X-Idempotency-Key'] = idempotencyKey;
      }

      const res = await bikApi.post('/transactions/transfer', data, { headers });
      set({ loading: false, success: true });
      
      // Sincronizar saldos de las cuentas
      useAccountsStore.getState().fetchDashboardData();
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al procesar la transferencia';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  /**
   * Ejecuta una transferencia interbancaria (ACH).
   */
  transferACH: async (data, idempotencyKey) => {
    set({ loading: true, error: null, success: false });
    try {
      const headers = {};
      if (idempotencyKey) {
        headers['X-Idempotency-Key'] = idempotencyKey;
      }

      const res = await bikApi.post('/transactions/transfer-ach', data, { headers });
      set({ loading: false, success: true });
      
      useAccountsStore.getState().fetchDashboardData();
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al procesar transferencia ACH';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  /**
   * Ejecuta una transferencia móvil.
   */
  transferMobile: async (data, idempotencyKey) => {
    set({ loading: true, error: null, success: false });
    try {
      const headers = {};
      if (idempotencyKey) {
        headers['X-Idempotency-Key'] = idempotencyKey;
      }

      const res = await bikApi.post('/transactions/transfer-mobile', data, { headers });
      set({ loading: false, success: true });
      
      useAccountsStore.getState().fetchDashboardData();
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al procesar transferencia móvil';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  /**
   * Ejecuta una transferencia internacional.
   */
  transferInternational: async (data, idempotencyKey) => {
    set({ loading: true, error: null, success: false });
    try {
      const headers = {};
      if (idempotencyKey) {
        headers['X-Idempotency-Key'] = idempotencyKey;
      }

      const res = await bikApi.post('/transactions/transfer-international', data, { headers });
      set({ loading: false, success: true });
      
      useAccountsStore.getState().fetchDashboardData();
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al procesar transferencia internacional';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  resetState: () => set({ loading: false, error: null, success: false })
}));
