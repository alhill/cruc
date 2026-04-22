import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppSideMenu } from '@/components/app-side-menu';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { auth } from '@/lib/firebase/auth';

export function FloatingMenuButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      setIsMenuOpen(false);
    } catch {
      Alert.alert('No se pudo cerrar sesion', 'Intenta de nuevo en unos segundos.');
    }
  }, []);

  const navigateTo = useCallback((path: '/(app)/_profile' | '/(app)/_settings') => {
    router.push(path);
    setIsMenuOpen(false);
  }, [router]);

  return (
    <>
      <Pressable
        onPress={() => setIsMenuOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Abrir menu"
        style={[
          styles.button,
          {
            top: insets.top + Spacing.two,
            backgroundColor: theme.backgroundElement,
          },
        ]}>
        <MaterialCommunityIcons name="dots-vertical" size={22} color={theme.text} />
      </Pressable>

      <AppSideMenu
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onProfilePress={() => navigateTo('/(app)/_profile')}
        onSettingsPress={() => navigateTo('/(app)/_settings')}
        onSignOutPress={handleSignOut}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: Spacing.three,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
