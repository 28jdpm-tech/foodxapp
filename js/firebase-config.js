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

// ============================================
// Modo Prueba Aislado (No toca producción)
// ============================================
const _urlParams = new URLSearchParams(window.location.search);
if (_urlParams.get('test') === 'true') {
    localStorage.setItem('foodx_test_mode', 'true');
} else if (_urlParams.get('test') === 'false') {
    localStorage.setItem('foodx_test_mode', 'false');
}

// Activo si está guardado en localStorage, en la URL (?test=true), o ejecutado localmente (file:)
const IS_TEST_MODE = localStorage.getItem('foodx_test_mode') === 'true' || 
                     window.location.search.includes('test=true') || 
                     window.location.protocol === 'file:';

function getDbCollection(colName) {
    if (IS_TEST_MODE) {
        return db.collection('test_' + colName);
    }
    return db.collection(colName);
}
