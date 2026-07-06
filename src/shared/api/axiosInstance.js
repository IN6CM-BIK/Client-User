import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Para desarrollo local en emuladores/dispositivos físicos, el host varía.
// 10.0.2.2 es el alias especial para el host en emuladores de Android.
const getBaseUrl = () => {
  // Si existe variable de entorno la usamos
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Fallbacks razonables
  return 'http://10.0.2.2:5000/api';
};

/**
 * Instancia global de Axios preconfigurada para apuntar al BIK-Server-User (puerto 5000).
 */
export const bikApi = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
});

/**
 * Interceptor de Peticiones.
 * Inyecta el token JWT desde el SecureStore si existe.
 */
bikApi.interceptors.request.use(
  async (config) => {
    try {
      // Leemos el estado almacenado en SecureStore
      const authStorage = await SecureStore.getItemAsync('bik-auth-storage');
      if (authStorage) {
        let parsed = JSON.parse(authStorage);
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        const token = parsed.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      console.warn('Error al leer token en interceptor de Axios:', e.message);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de Respuestas.
 * Maneja errores globales como caducidad de token (401).
 */
bikApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Sesión caducada o inválida (401). Purgando almacenamiento.');
      try {
        await SecureStore.deleteItemAsync('bik-auth-storage');
      } catch (e) {
        console.error('Error al limpiar almacenamiento tras 401:', e.message);
      }
    }
    return Promise.reject(error);
  }
);
