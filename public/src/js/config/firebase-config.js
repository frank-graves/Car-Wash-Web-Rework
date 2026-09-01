/** Inicialización de Firebase. Requiere scripts compat cargados antes. */

export const FIREBASE_CONFIG = Object.freeze({
  apiKey: "AIzaSyDAfC7KYoY_P3tVCeY_ljLrmPxt-fO4bh0",
  authDomain: "car-wash-7cc3d.firebaseapp.com",
  projectId: "car-wash-7cc3d",
  storageBucket: "car-wash-7cc3d.firebasestorage.app",
  messagingSenderId: "538896177028",
  appId: "1:538896177028:web:c948aaafe47631a839efd1"
});

// Placeholder de App Check. Reemplazar con la site key real de reCAPTCHA v3.
const APP_CHECK_SITE_KEY = 'SITE_KEY_RECAPTCHA_V3';

export function inicializarFirebase() {
  if (typeof firebase === 'undefined') return { db: null, auth: null };
  if (FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.startsWith("PEGA_AQUI")) {
    firebase.initializeApp(FIREBASE_CONFIG);

    // App Check: blindaje contra abuso del apiKey fuera del cliente oficial.
    if (firebase.appCheck && APP_CHECK_SITE_KEY !== 'SITE_KEY_RECAPTCHA_V3') {
      firebase.appCheck().activate(APP_CHECK_SITE_KEY, true);
    }

    return { db: firebase.firestore(), auth: firebase.auth() };
  }
  return { db: null, auth: null };
}
