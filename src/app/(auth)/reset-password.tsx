import { router, useLocalSearchParams } from 'expo-router';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
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

type ResetPasswordForm = {
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { oobCode } = useLocalSearchParams<{ oobCode: string }>();

  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [codeValid, setCodeValid] = useState(false);

  const { control, handleSubmit } = useForm<ResetPasswordForm>({
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!oobCode) {
      setError('No se encontró el código de recuperación.');
      setIsVerifying(false);
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then(() => setCodeValid(true))
      .catch(() => setError('El código no es válido o ha caducado.'))
      .finally(() => setIsVerifying(false));
  }, [oobCode]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (data.password !== data.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!oobCode) return;

    setError('');
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      setDone(true);
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
              <Text className="mb-1 text-3xl font-bold text-slate-900">Nueva contraseña</Text>
              <Text className="mb-8 text-base text-slate-500">
                Elige una nueva contraseña para tu cuenta
              </Text>

              {isVerifying ? (
                <ActivityIndicator className="mt-8" />
              ) : done ? (
                <View className="rounded-2xl bg-green-50 p-5">
                  <Text className="mb-1 text-base font-semibold text-green-800">
                    ¡Contraseña actualizada!
                  </Text>
                  <Text className="text-sm leading-6 text-green-700">
                    Ya puedes iniciar sesión con tu nueva contraseña.
                  </Text>
                </View>
              ) : !codeValid ? (
                <View className="rounded-2xl bg-red-50 p-5">
                  <Text className="text-sm text-red-700">{error}</Text>
                </View>
              ) : (
                <View className="gap-5">
                  <ControlledTextInput
                    control={control}
                    name="password"
                    label="Nueva contraseña"
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
                  {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
                </View>
              )}
            </View>

            <View className="mt-8 gap-3">
              {done || !codeValid ? (
                <Pressable
                  onPress={() => router.replace('/(auth)/login')}
                  className="items-center rounded-2xl bg-blue-500 px-6 py-4 active:opacity-80">
                  <Text className="text-base font-semibold text-white">Ir al inicio de sesión</Text>
                </Pressable>
              ) : codeValid && !isVerifying ? (
                <Pressable
                  onPress={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="items-center rounded-2xl bg-blue-500 px-6 py-4 active:opacity-80 disabled:opacity-50">
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-base font-semibold text-white">Guardar contraseña</Text>
                  )}
                </Pressable>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
