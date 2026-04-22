import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { auth } from '@/lib/firebase/auth';

WebBrowser.maybeCompleteAuthSession();

/**
 * Hook for Google Sign-In via Firebase.
 *
 * Requires the following env variables to be set:
 *   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
 *
 * Client IDs are found in the Google Cloud Console / Firebase project settings.
 */
export function useGoogleSignIn(onError: (message: string) => void) {
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId,
    iosClientId,
    webClientId,
  });

  const missingConfig: string[] = [];
  if (!webClientId) {
    missingConfig.push('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  }
  if (Platform.OS === 'android' && !androidClientId) {
    missingConfig.push('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID');
  }
  if (Platform.OS === 'ios' && !iosClientId) {
    missingConfig.push('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
  }

  const isConfigured = missingConfig.length === 0;

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      if (!idToken) {
        onError(
          'Google devolvio respuesta pero no idToken. Revisa WEB_CLIENT_ID y la config OAuth en Firebase/Google Cloud.'
        );
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(auth, credential).catch(() => {
        onError('Error al iniciar sesión con Google.');
      });
    } else if (response?.type === 'error') {
      onError('Error al iniciar sesión con Google. Revisa configuración OAuth y SHA-1/SHA-256.');
    }
  }, [response, onError]);

  return {
    signIn: () => {
      if (!isConfigured) {
        onError(`Faltan variables OAuth: ${missingConfig.join(', ')}`);
        return;
      }
      if (!request) {
        onError('Google OAuth aun no esta listo. Intenta de nuevo en unos segundos.');
        return;
      }
      void promptAsync();
    },
    isReady: !!request && isConfigured,
    isConfigured,
    missingConfig,
  };
}
