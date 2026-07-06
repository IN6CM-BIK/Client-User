import * as SecureStore from 'expo-secure-store';

/**
 * Adaptador de almacenamiento seguro para Zustand persist.
 * Proporciona persistencia cifrada nativa.
 */
export const secureStorage = {
  getItem: async (name) => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.error('Error al recuperar desde SecureStore:', error);
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('Error al guardar en SecureStore:', error);
    }
  },
  removeItem: async (name) => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('Error al eliminar desde SecureStore:', error);
    }
  }
};
