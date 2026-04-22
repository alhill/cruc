import { Link, router } from 'expo-router';
import { type FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TOSModal } from '@/components/auth/tos-modal';
import { ControlledTextInput } from '@/components/forms/controlled-text-input';
import { auth } from '@/lib/firebase/auth';
import { getAuthErrorMessage } from '@/lib/firebase/auth-errors';

type RegisterForm = {
  email: string;
  password: string;
  confirmPassword: string;
};

const FIRESTORE_ERROR_MESSAGES: Record<string, string> = {
  'permission-denied': 'No tienes permisos para crear el perfil de usuario.',
  unavailable: 'Firestore no esta disponible ahora mismo. Intentalo de nuevo.',
  'deadline-exceeded': 'Firestore ha tardado demasiado en responder. Intentalo otra vez.',
};

function getRegisterErrorMessage(error: unknown): string {
  const code = (error as FirebaseError | undefined)?.code;

  if (!code) {
    return 'Ha ocurrido un error. Intentalo de nuevo.';
  }

  if (code.startsWith('auth/')) {
    return getAuthErrorMessage(error);
  }

  if (code.startsWith('firestore/')) {
    const normalizedCode = code.replace('firestore/', '');
    return FIRESTORE_ERROR_MESSAGES[normalizedCode] ?? 'No se pudo crear tu perfil de usuario.';
  }

  return 'Ha ocurrido un error. Intentalo de nuevo.';
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [tosModalVisible, setTosModalVisible] = useState(false);

  const { control, handleSubmit } = useForm<RegisterForm>({
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    if (!tosAccepted) {
      setError('Debes aceptar los términos y condiciones para continuar.');
      return;
    }
    if (data.password !== data.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);

      router.replace('/(app)');
    } catch (e) {
      setError(getRegisterErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled">
          <View
            className="flex-1 justify-between px-5"
            style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
            {/* Header */}
            <View>
              <Pressable onPress={() => router.back()} hitSlop={8} className="mb-8 self-start">
                <Text className="text-base text-slate-500">← Atrás</Text>
              </Pressable>

              <Text className="mb-1 text-3xl font-bold text-slate-900">Crear cuenta</Text>
              <Text className="mb-8 text-base text-slate-500">
                Únete a Cruc y empieza tu diario
              </Text>

              {/* Form */}
              <View className="gap-5">
                <ControlledTextInput
                  control={control}
                  name="email"
                  label="Email"
                  placeholder="tu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <ControlledTextInput
                  control={control}
                  name="password"
                  label="Contraseña"
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                  autoCapitalize="none"
                />
                <ControlledTextInput
                  control={control}
                  name="confirmPassword"
                  label="Confirmar contraseña"
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              {/* TOS Checkbox */}
              <View className="mt-6 flex-row items-center gap-3">
                <Pressable
                  onPress={() => setTosAccepted((current) => !current)}
                  className={`h-5 w-5 items-center justify-center rounded border-2 ${
                    tosAccepted ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'
                  }`}
                  hitSlop={8}>
                  {tosAccepted ? <Text className="text-xs font-bold text-white">✓</Text> : null}
                </Pressable>

                <Text className="flex-1 text-sm text-slate-600">
                  Acepto los{' '}
                  <Text
                    className="text-blue-500 underline"
                    onPress={() => setTosModalVisible(true)}>
                    términos y condiciones
                  </Text>
                </Text>
              </View>

              {error ? (
                <Text className="mt-4 text-sm text-red-600">{error}</Text>
              ) : null}
            </View>

            {/* Actions */}
            <View className="mt-8 gap-3">
              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="items-center rounded-2xl bg-blue-500 px-6 py-4 active:opacity-80 disabled:opacity-50">
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-semibold text-white">Crear cuenta</Text>
                )}
              </Pressable>

              <View className="flex-row justify-center gap-1">
                <Text className="text-sm text-slate-500">¿Ya tienes cuenta?</Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable hitSlop={4}>
                    <Text className="text-sm font-semibold text-blue-500">Iniciar sesión</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TOSModal
        visible={tosModalVisible}
        onAccept={() => {
          setTosModalVisible(false);
        }}
        onClose={() => setTosModalVisible(false)}
      />
    </View>
  );
}
