import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
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

import { ControlledTextInput } from '@/components/forms/controlled-text-input';
import { auth } from '@/lib/firebase/auth';
import { getAuthErrorMessage } from '@/lib/firebase/auth-errors';

type ForgotPasswordForm = {
  email: string;
};

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const { control, handleSubmit } = useForm<ForgotPasswordForm>({
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError('');
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setSent(true);
    } catch (e) {
      setError(getAuthErrorMessage(e));
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
            <View>
              <Pressable onPress={() => router.back()} hitSlop={8} className="mb-8 self-start">
                <Text className="text-base text-slate-500">← Atrás</Text>
              </Pressable>

              <Text className="mb-1 text-3xl font-bold text-slate-900">Recuperar contraseña</Text>
              <Text className="mb-8 text-base text-slate-500">
                Te enviaremos un enlace para restablecer tu contraseña
              </Text>

              {sent ? (
                <View className="rounded-2xl bg-green-50 p-5">
                  <Text className="mb-1 text-base font-semibold text-green-800">
                    ¡Email enviado!
                  </Text>
                  <Text className="text-sm leading-6 text-green-700">
                    Revisa tu bandeja de entrada y sigue las instrucciones del correo para
                    restablecer tu contraseña.
                  </Text>
                </View>
              ) : (
                <View className="gap-5">
                  <ControlledTextInput
                    control={control}
                    name="email"
                    label="Email"
                    placeholder="tu@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {error ? (
                    <Text className="text-sm text-red-600">{error}</Text>
                  ) : null}
                </View>
              )}
            </View>

            <View className="mt-8 gap-3">
              {sent ? (
                <Pressable
                  onPress={() => router.replace('/(auth)/login')}
                  className="items-center rounded-2xl bg-blue-500 px-6 py-4 active:opacity-80">
                  <Text className="text-base font-semibold text-white">Volver al inicio de sesión</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="items-center rounded-2xl bg-blue-500 px-6 py-4 active:opacity-80 disabled:opacity-50">
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-base font-semibold text-white">Enviar enlace</Text>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
