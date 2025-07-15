
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function checkConfig(config: Record<string, string | undefined>, prefix: string): void {
  const missingKeys = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => `${prefix}${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

  if (missingKeys.length > 0) {
    const message = `Warning: Firebase configuration is incomplete. Missing environment variables: ${missingKeys.join(', ')}. Please check your .env.local file.`;
    if (typeof window === 'undefined') { // Server-side
      console.warn(message);
    } else { // Client-side
      // Avoid logging verbose warnings in browser console during development if not critical for page load
      // but ensure developers are aware if core functionality might break.
      // For a real app, you might want to throw an error or show a UI message if essential config is missing.
      if (process.env.NODE_ENV === 'development') {
        console.warn(message);
      }
    }
  }
}

checkConfig(firebaseConfig, 'NEXT_PUBLIC_FIREBASE_');
