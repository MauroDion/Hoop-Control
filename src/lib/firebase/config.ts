
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bcsjd-1ecad",
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
      if (process.env.NODE_ENV === 'development') {
        console.warn(message);
      }
    }
  }
}

checkConfig(firebaseConfig, 'NEXT_PUBLIC_FIREBASE_');
