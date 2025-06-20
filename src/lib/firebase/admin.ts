
import admin from 'firebase-admin';

// Prevenir la reinicialización si ya se ha hecho
if (!admin.apps.length) {
  try {
    // Opción 1: Usar una cadena JSON de la cuenta de servicio desde una variable de entorno.
    // Esto es más amigable con Edge que las rutas de archivo.
    const serviceAccountJsonString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJsonString) {
      console.log('Firebase Admin SDK: Inicializando con JSON de cuenta de servicio desde variable de entorno.');
      const serviceAccount = JSON.parse(serviceAccountJsonString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Opción 2: Inicialización predeterminada (confía en las credenciales proporcionadas por el entorno, como en App Hosting)
      // Esto también es lo que el Edge Runtime usará típicamente con éxito en un entorno Firebase.
      console.log('Firebase Admin SDK: Inicializando con credenciales predeterminadas (adecuado para App Hosting y Edge).');
      admin.initializeApp();
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK: Error durante la inicialización:', error.stack);
    // Considera cómo manejar los errores de inicialización. Por ahora, registra y continúa.
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore(); // Si necesitas acceso de admin a Firestore
export default admin;
