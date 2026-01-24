// ============================================
// FoodX POS - Firebase Configuration
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyA4U6ES3hheqBdrfVPngSfAF6MUJ_EhBxE",
    authDomain: "foodx-pos.firebaseapp.com",
    projectId: "foodx-pos",
    storageBucket: "foodx-pos.firebasestorage.app",
    messagingSenderId: "632424386144",
    appId: "1:632424386144:web:77c8825ec4e9dae7e63d05",
    measurementId: "G-TB9GJ6RP79"
};

// Inicializar Firebase (Usando versión Compat para compatibilidad directa con script tags)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Habilitar persistencia offline
db.enablePersistence().catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn('Persistencia falló: múltiples pestañas abiertas');
    } else if (err.code == 'unimplemented') {
        console.warn('El navegador no soporta persistencia');
    }
});
