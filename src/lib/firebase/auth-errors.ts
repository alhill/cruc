import { type FirebaseError } from 'firebase/app';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'No hay ninguna cuenta con ese email.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
  'auth/invalid-email': 'El formato del email no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde.',
  'auth/network-request-failed': 'Error de red. Comprueba tu conexión.',
  'auth/popup-closed-by-user': 'Inicio de sesión cancelado.',
  'auth/expired-action-code': 'El código ha caducado. Solicita uno nuevo.',
  'auth/invalid-action-code': 'El código no es válido o ya fue usado.',
};

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as FirebaseError)?.code;
  return AUTH_ERROR_MESSAGES[code] ?? 'Ha ocurrido un error. Inténtalo de nuevo.';
}
