import { Link } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MARKETING_CARDS = [
  {
    id: '1',
    emoji: '✍️',
    title: 'Tu diario, inteligente',
    body: 'Escribe libremente y deja que la IA organice tus pensamientos, emociones y hábitos de forma automática.',
  },
  {
    id: '2',
    emoji: '🧠',
    title: 'Insights que importan',
    body: 'Descubre patrones en tu estado de ánimo, energía y rutinas sin esfuerzo. La app detecta lo que más te afecta.',
  },
  {
    id: '3',
    emoji: '🔒',
    title: 'Privado por diseño',
    body: 'Tus entradas son tuyas. Cifradas y protegidas. No compartimos tu contenido personal con nadie.',
  },
  {
    id: '4',
    emoji: '⚡️',
    title: 'Sin interrupciones',
    body: 'La IA trabaja en segundo plano. Escribe, cierra la app y cuando vuelvas ya tendrás todo procesado.',
  },
];

export default function LandingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View
          className="items-center px-6 pb-10 pt-16"
          style={{ paddingTop: insets.top + 32 }}>
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-blue-500">
            <Text className="text-4xl">📔</Text>
          </View>
          <Text className="text-center text-4xl font-bold tracking-tight text-slate-900">Cruc</Text>
          <Text className="mt-2 text-center text-base text-slate-500">
            El diario que te entiende
          </Text>
        </View>

        {/* Feature cards */}
        <View className="gap-3 px-5">
          {MARKETING_CARDS.map((card) => (
            <View
              key={card.id}
              className="rounded-3xl bg-slate-50 p-5">
              <Text className="mb-2 text-3xl">{card.emoji}</Text>
              <Text className="mb-1 text-base font-semibold text-slate-900">{card.title}</Text>
              <Text className="text-sm leading-6 text-slate-500">{card.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed CTA buttons */}
      <View
        className="absolute bottom-0 left-0 right-0 gap-3 bg-white/95 px-5 pb-6 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
        <Link href="/(auth)/register" asChild>
          <Pressable className="items-center rounded-2xl bg-blue-500 px-6 py-4 active:opacity-80">
            <Text className="text-base font-semibold text-white">Crear cuenta</Text>
          </Pressable>
        </Link>
        <Link href="/(auth)/login" asChild>
          <Pressable className="items-center rounded-2xl bg-slate-100 px-6 py-4 active:opacity-80">
            <Text className="text-base font-semibold text-slate-700">Iniciar sesión</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
