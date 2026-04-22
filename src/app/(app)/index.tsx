import { type FirebaseError } from 'firebase/app';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, TextInput, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FloatingMenuButton } from '@/components/floating-menu-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { auth } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/firestore';
import { useAuthStore } from '@/stores/auth-store';

type UserEventType = 'user_note' | 'user_deep';
type EventSource = 'text';
type EventStatus = 'pending';

type PendingJournalEvent = {
  id: string;
  timestamp: string;
  type: UserEventType;
  source: EventSource;
  user_input: string;
  media: string[];
  modules_active: string[];
  structured_data: Array<{
    version: number;
    processed_at: string;
    modules_used: Record<string, { version: number }>;
    analysis: Record<string, Record<string, unknown>>;
  }>;
  status: EventStatus;
};

const EVENT_TYPE_OPTIONS: { label: string; value: UserEventType }[] = [
  { label: 'Nota', value: 'user_note' },
  { label: 'Conversacion', value: 'user_deep' },
];

function getErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const firebaseError = error as FirebaseError;
  return typeof firebaseError.code === 'string' ? firebaseError.code : null;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error('timeout'));
      }, timeoutMs);
    }),
  ]);
}

export default function HomeScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const [eventType, setEventType] = useState<UserEventType>('user_note');
  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uid = user?.uid ?? auth.currentUser?.uid ?? null;
  const trimmedInput = useMemo(() => userInput.trim(), [userInput]);
  const canSubmit = trimmedInput.length > 0 && !isSubmitting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      return;
    }

    if (!uid) {
      Alert.alert('Sesion no disponible', 'Inicia sesion para crear eventos.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure auth token is fresh for Firestore
      await auth.currentUser?.getIdToken(true);

      const eventsRef = collection(db, 'users', uid, 'events');
      const newEventRef = doc(eventsRef);

      console.log('About to save event with uid:', uid, 'auth state:', {
        isAuthenticated: !!auth.currentUser,
        authUid: auth.currentUser?.uid,
      });

      const eventPayload: PendingJournalEvent = {
        id: newEventRef.id,
        timestamp: new Date().toISOString(),
        type: eventType,
        source: 'text',
        user_input: trimmedInput,
        media: [],
        modules_active: [],
        structured_data: [],
        status: 'pending',
      };

      await withTimeout(setDoc(newEventRef, eventPayload), 10000);

      if (eventType === 'user_note' && Platform.OS === 'android') {
        ToastAndroid.show('Nota guardada', ToastAndroid.SHORT);
      }

      setUserInput('');
      setEventType('user_note');
    } catch (error: unknown) {
      const errorCode = getErrorCode(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.warn('Failed to save event', {
        uid,
        errorCode,
        errorMessage,
        fullError: error,
      });

      const message =
        errorCode === 'permission-denied'
          ? 'No tienes permisos para escribir este evento.'
          : errorCode === 'unauthenticated'
            ? 'Tu sesion expiro. Vuelve a iniciar sesion.'
            : errorCode === 'unavailable' || (error instanceof Error && error.message === 'timeout')
              ? 'No se pudo conectar con Firestore. Revisa red y backend.'
              : 'Intenta de nuevo en unos segundos.';

      Alert.alert('No se pudo enviar', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, eventType, trimmedInput, uid]);

  return (
    <ThemedView style={styles.container}>
      <FloatingMenuButton />
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.title}>
          Escribe tu entrada
        </ThemedText>

        <TextInput
          value={userInput}
          onChangeText={setUserInput}
          placeholder="Que quieres registrar hoy?"
          placeholderTextColor={theme.textSecondary}
          multiline
          textAlignVertical="top"
          style={[
            styles.input,
            {
              color: theme.text,
              borderColor: theme.backgroundSelected,
              backgroundColor: theme.backgroundElement,
            },
          ]}
        />

        <ThemedView style={styles.radioGroup}>
          {EVENT_TYPE_OPTIONS.map((option) => {
            const selected = option.value === eventType;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setEventType(option.value);
                }}
                style={[
                  styles.radioItem,
                  {
                    borderColor: selected ? theme.text : 'transparent',
                    backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                  },
                ]}>
                <ThemedText type="small">{option.label}</ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>

        <Pressable
          disabled={!canSubmit}
          onPress={handleSubmit}
          style={[
            styles.submitButton,
            {
              backgroundColor: canSubmit ? theme.text : theme.backgroundSelected,
            },
          ]}>
          <ThemedText
            type="smallBold"
            style={{
              color: canSubmit ? theme.background : theme.textSecondary,
              textAlign: 'center',
            }}>
            Enviar
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'stretch',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    paddingTop: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  title: {
    textAlign: 'left',
  },
  input: {
    minHeight: 280,
    borderWidth: 1,
    borderRadius: Spacing.four,
    padding: Spacing.three,
    fontSize: 18,
    lineHeight: 26,
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  radioItem: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: Spacing.one,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
});
