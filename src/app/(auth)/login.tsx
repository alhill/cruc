import { Link, router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ControlledTextInput } from '@/components/forms/controlled-text-input';
import { useGoogleSignIn } from '@/hooks/use-google-sign-in';
import { auth } from '@/lib/firebase/auth';
import { getAuthErrorMessage } from '@/lib/firebase/auth-errors';

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit } = useForm<LoginForm>({
    defaultValues: { email: '', password: '' },
  });

  const {
    signIn: signInWithGoogle,
    isReady: isGoogleReady,
    isConfigured: isGoogleConfigured,
    missingConfig,
  } = useGoogleSignIn(setError);

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      router.replace('/(app)');
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
          {/* Header */}
          <View>
            <Pressable onPress={() => router.back()} hitSlop={8} className="mb-8 self-start">
              <Text className="text-base text-slate-500">← Atrás</Text>
            </Pressable>

            <Text className="mb-1 text-3xl font-bold text-slate-900">Bienvenido</Text>
            <Text className="mb-8 text-base text-slate-500">Inicia sesión para continuar</Text>

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
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {error ? (
              <Text className="mt-4 text-sm text-red-600">{error}</Text>
            ) : null}

            <Link href="/(auth)/forgot-password" asChild>
              <Pressable className="mt-4 self-start" hitSlop={8}>
                <Text className="text-sm text-blue-500">¿Olvidaste tu contraseña?</Text>
              </Pressable>
            </Link>
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
                <Text className="text-base font-semibold text-white">Iniciar sesión</Text>
              )}
            </Pressable>

            <Pressable
              onPress={signInWithGoogle}
              className="flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 active:opacity-80">
              <Text className="text-base font-semibold text-slate-700">Continuar con Google</Text>
            </Pressable>

            {!isGoogleConfigured ? (
              <Text className="text-xs leading-5 text-amber-700">
                Falta configuración OAuth en variables: {missingConfig.join(', ')}
              </Text>
            ) : !isGoogleReady ? (
              <Text className="text-xs leading-5 text-slate-500">
                Inicializando Google OAuth...
              </Text>
            ) : null}

            <View className="flex-row justify-center gap-1">
              <Text className="text-sm text-slate-500">¿No tienes cuenta?</Text>
              <Link href="/(auth)/register" asChild>
                <Pressable hitSlop={4}>
                  <Text className="text-sm font-semibold text-blue-500">Crear cuenta</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

