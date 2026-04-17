import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { Colors } from '../Colors';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const segments = useSegments();
  const router = useRouter();
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    // Verificar sesión actual solo una vez al iniciar la app
    if (!hasCheckedSession.current) {
      hasCheckedSession.current = true;
      const checkInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      };
      checkInitialSession();
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Obtenemos la ruta actual como string
      const path = segments.join('/');

      // Si no hay sesión y no estamos en login ni en modales, forzar login
      if (!session && path !== 'login' && !path.startsWith('add-')) {
        router.replace('/login');
      }
      // Si hay sesión y estamos en login, ir al inicio
      else if (session && path === 'login') {
        router.replace('/(tabs)');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: themeColors.card },
          headerTintColor: themeColors.text,
          headerTitleStyle: { color: themeColors.text },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        {/* Modales con presentación de tarjeta */}
        <Stack.Screen
          name="add-expense"
          options={{ presentation: 'modal', headerShown: true, title: 'Nuevo Gasto' }}
        />
        <Stack.Screen
          name="add-card"
          options={{ presentation: 'modal', headerShown: true, title: 'Nueva Tarjeta' }}
        />
        <Stack.Screen
          name="add-external"
          options={{ presentation: 'modal', headerShown: true, title: 'Nuevo Contacto' }}
        />
        <Stack.Screen name="add-group-member" options={{ presentation: 'modal', title: 'Invitar Amigo' }} />

        <Stack.Screen name="add-group" options={{ presentation: 'modal', title: 'Nuevo Grupo' }} />

        <Stack.Screen name="edit-expense/[id]" options={{ title: 'Editar Gasto', presentation: 'modal' }} />

      </Stack>
    </ThemeProvider>
  );
}
