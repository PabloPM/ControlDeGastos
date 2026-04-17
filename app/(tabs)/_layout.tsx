import { Link, Tabs } from 'expo-router';
import { BarChart2, CreditCard, PlusCircle, Settings, Users, Wallet } from 'lucide-react-native';
import { Pressable, useColorScheme } from 'react-native';
import { Colors } from '../../Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'dark'];

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: themeColors.card },
        headerTintColor: themeColors.text,
        headerTitleStyle: { color: themeColors.text },
        tabBarActiveTintColor: themeColors.linkText,
        tabBarInactiveTintColor: themeColors.text,
        tabBarStyle: { backgroundColor: themeColors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Gastos',
          tabBarIcon: ({ color }) => <Wallet size={24} color={color} />,
          // Botón para abrir el formulario de nuevo gasto
          headerRight: () => (
            <Link href="/add-expense" asChild>
              <Pressable style={{ marginRight: 15 }}>
                <PlusCircle size={28} color={themeColors.primary} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Grupos',

          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
          headerRight: () => (
            <Link href="/add-external" asChild>
              <Pressable style={{ marginRight: 15 }}>
                <PlusCircle size={28} color={themeColors.primary} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Métodos de Pago',
          tabBarIcon: ({ color }) => <CreditCard size={24} color={color} />,
          headerRight: () => (
            <Link href="/add-card" asChild>
              <Pressable style={{ marginRight: 15 }}>
                <PlusCircle size={28} color={themeColors.primary} />
              </Pressable>
            </Link>
          ),
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          headerShown: false,
          title: 'Estadísticas',
          tabBarIcon: ({ color }) => <BarChart2 size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />

    </Tabs>
  );
}
