import registerRootComponent from 'expo/build/launch/registerRootComponent';
import App from './App';

// Inicializar tarefa nativa em segundo plano para o leitor de notificações Android
import './src/services/notificationListenerHeadless';

registerRootComponent(App);
