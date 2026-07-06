import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent hace que Expo maneje la carga de la aplicación correctamente,
// independientemente de si se ejecuta en Expo Go, en desarrollo o en producción.
registerRootComponent(App);
