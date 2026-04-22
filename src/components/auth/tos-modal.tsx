import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TOSModalProps = {
  visible: boolean;
  onAccept: () => void;
  onClose: () => void;
};

export function TOSModal({ visible, onAccept, onClose }: TOSModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top || 16 }}>
        <View className="flex-row items-center justify-between px-5 pb-4 pt-2">
          <Text className="text-xl font-bold text-slate-900">Términos y condiciones</Text>
          <Pressable onPress={onClose} className="rounded-full p-1" hitSlop={8}>
            <Text className="text-base text-slate-500">Cerrar</Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <Text className="mb-4 text-sm leading-6 text-slate-700">
            Bienvenido a Cruc. Al usar esta aplicación, aceptas los siguientes términos.
          </Text>

          <Text className="mb-2 text-base font-semibold text-slate-900">1. Uso de la aplicación</Text>
          <Text className="mb-4 text-sm leading-6 text-slate-700">
            Cruc es un diario personal potenciado por inteligencia artificial. Te comprometes a usar el
            servicio únicamente para fines personales y legales. No está permitido el uso de la
            aplicación para actividades ilegales, dañinas o que violen derechos de terceros.
          </Text>

          <Text className="mb-2 text-base font-semibold text-slate-900">2. Privacidad y datos</Text>
          <Text className="mb-4 text-sm leading-6 text-slate-700">
            Tus entradas de diario son privadas y están cifradas. No compartimos tu contenido personal
            con terceros salvo los procesadores necesarios para el funcionamiento del servicio (como
            los modelos de IA que procesan tus entradas). Consulta nuestra Política de Privacidad para
            más detalles.
          </Text>

          <Text className="mb-2 text-base font-semibold text-slate-900">3. Procesamiento por IA</Text>
          <Text className="mb-4 text-sm leading-6 text-slate-700">
            La aplicación usa inteligencia artificial para analizar y estructurar tu contenido. Este
            procesamiento ocurre de forma asíncrona. Los resultados se almacenan de forma segura y
            solo son accesibles por ti.
          </Text>

          <Text className="mb-2 text-base font-semibold text-slate-900">4. Límite de responsabilidad</Text>
          <Text className="mb-4 text-sm leading-6 text-slate-700">
            Cruc se proporciona "tal cual". No garantizamos disponibilidad continua del servicio. No
            somos responsables de pérdida de datos o perjuicios derivados del uso de la aplicación
            más allá de lo previsto por la ley aplicable.
          </Text>

          <Text className="mb-2 text-base font-semibold text-slate-900">5. Modificaciones</Text>
          <Text className="mb-4 text-sm leading-6 text-slate-700">
            Podemos actualizar estos términos ocasionalmente. Te notificaremos de cambios relevantes.
            El uso continuado de la aplicación implica la aceptación de los términos actualizados.
          </Text>

          <Text className="mb-4 text-sm leading-6 text-slate-700">
            Última actualización: marzo 2026
          </Text>
        </ScrollView>

        <View className="px-5 pb-6 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
          <Pressable
            onPress={onAccept}
            className="items-center rounded-2xl bg-blue-500 px-6 py-4 active:opacity-80">
            <Text className="text-base font-semibold text-white">Acepto los términos</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
