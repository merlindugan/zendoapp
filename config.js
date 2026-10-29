// =====================================================
//  ZENDOAPP · CONFIGURACIÓN
//  Es el único archivo que tenés que editar.
// =====================================================

// 1) Pegá acá la configuración de tu proyecto de Firebase
//    (Firebase → Configuración del proyecto → Tus apps → Web → firebaseConfig).
//    Mientras esté en null, la app funciona en MODO DEMO con datos de ejemplo.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCCvvWiO1MOzkNB3YwGJXpeKUJNo4qZobg",
  authDomain: "zendoapp-e0fe4.firebaseapp.com",
  projectId: "zendoapp-e0fe4",
  storageBucket: "zendoapp-e0fe4.firebasestorage.app",
  messagingSenderId: "307302153292",
  appId: "1:307302153292:web:a285c5c62cfe5b5372c8e9"
};
/* Ejemplo de cómo queda:
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "zendoapp-xxxx.firebaseapp.com",
  projectId: "zendoapp-xxxx",
  storageBucket: "zendoapp-xxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
*/

// 2) El email con el que vas a entrar como profe (el mismo que creás en Firebase → Authentication).
window.ADMIN_EMAIL = "merdugan99@gmail.com";

// 3) Clave de avisos (Firebase → Configuración del proyecto → Cloud Messaging →
//    Certificados push web → "Par de claves"). Mientras esté en null, los avisos
//    funcionan sólo con la app abierta.
window.FCM_VAPID_KEY = null;
