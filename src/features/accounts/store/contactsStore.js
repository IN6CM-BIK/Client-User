import { create } from 'zustand';
import { bikApi } from '../../../shared/api/axiosInstance';

/**
 * Almacén de estado global para los contactos de transferencia del cliente.
 */
export const useContactsStore = create((set) => ({
  contacts: [],
  loading: false,
  error: null,

  fetchContacts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await bikApi.get('/contacts');
      set({ contacts: res.data.data || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addContact: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await bikApi.post('/contacts', data);
      set((state) => ({
        contacts: [...state.contacts, res.data.data],
        loading: false
      }));
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al crear contacto';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  updateContact: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const res = await bikApi.put(`/contacts/${id}`, data);
      set((state) => ({
        contacts: state.contacts.map(c => c._id === id ? res.data.data : c),
        loading: false
      }));
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al actualizar contacto';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  deleteContact: async (id) => {
    set({ loading: true, error: null });
    try {
      await bikApi.delete(`/contacts/${id}`);
      set((state) => ({
        contacts: state.contacts.filter(c => c._id !== id),
        loading: false
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Error al eliminar contacto', loading: false });
      return false;
    }
  }
}));
