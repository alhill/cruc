import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type AppSideMenuProps = {
  visible: boolean;
  onClose: () => void;
  onProfilePress: () => void;
  onSettingsPress: () => void;
  onSignOutPress: () => void;
};

export function AppSideMenu({
  visible,
  onClose,
  onProfilePress,
  onSettingsPress,
  onSignOutPress,
}: AppSideMenuProps) {
  if (!visible) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Pressable style={styles.overlay} onPress={onClose} accessibilityRole="button" />

      <ThemedView style={styles.drawer}>
        <ThemedText type="smallBold" style={styles.title}>
          Menu
        </ThemedText>

        <Pressable onPress={onProfilePress} style={styles.item} accessibilityRole="button">
          <ThemedText>Perfil</ThemedText>
        </Pressable>

        <Pressable onPress={onSettingsPress} style={styles.item} accessibilityRole="button">
          <ThemedText>Configuracion</ThemedText>
        </Pressable>

        <Pressable onPress={onSignOutPress} style={styles.item} accessibilityRole="button">
          <ThemedText>Cerrar sesion</ThemedText>
        </Pressable>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  drawer: {
    width: 260,
    height: '100%',
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.three,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(120, 120, 120, 0.25)',
    gap: Spacing.one,
  },
  title: {
    marginBottom: Spacing.two,
  },
  item: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
});
