import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { bikApi } from '../../../shared/api/axiosInstance';
import { secureStorage } from '../../../shared/store/useSecureStore';

/**
 * Almacén de estado global persistido (Zustand) para la autenticación y sesión de banca móvil.
 * Utiliza SecureStore para cifrar los datos de sesión almacenados localmente en el móvil.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      /**
       * Realiza el inicio de sesión del usuario contra BIK-Server-User.
       */
      login: async (identificador, password) => {
        try {
          set({ loading: true, error: null });

          const response = await bikApi.post('/auth/login', {
            identificador,
            password
          });

          if (response.data.status === 'success') {
            const { token, rol, user } = response.data;

            set({
              token,
              role: rol,
              user,
              isAuthenticated: true,
              loading: false,
              error: null
            });
            return rol;
          }
          return false;
        } catch (error) {
          const errMsg = error.response?.data?.message || 'Error de conexión con el servidor.';
          set({
            error: errMsg,
            loading: false
          });
          return false;
        }
      },

      /**
       * Registra un nuevo usuario cliente en el banco.
       */
      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await bikApi.post('/auth/register', userData);
          set({ loading: false });
          return response.data;
        } catch (error) {
          const errMsg = error.response?.data?.message || 'Error en el registro';
          set({ 
            loading: false, 
            error: errMsg 
          });
          throw error;
        }
      },

      /**
       * Cierra la sesión activa limpiando el estado.
       */
      logout: () => {
        set({ user: null, token: null, role: null, isAuthenticated: false, error: null });
      },

      /**
       * Limpia el mensaje de error activo.
       */
      clearError: () => set({ error: null }),
      
      /**
       * Actualiza la información del usuario del store tras una modificación local.
       */
      setUser: (user) => set({ user })
    }),
    {
      name: 'bik-auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
