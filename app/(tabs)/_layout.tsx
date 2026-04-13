import { Link, Tabs } from 'expo-router';
import { BarChart2, CreditCard, PlusCircle, Settings, Users, Wallet } from 'lucide-react-native';
import { Pressable } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#3B82F6' }}>
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
                <PlusCircle size={28} color="#3B82F6" />
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
                <PlusCircle size={28} color="#3B82F6" />
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
                <PlusCircle size={28} color="#3B82F6" />
              </Pressable>
            </Link>
          ),
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color }) => <BarChart2 size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />

    </Tabs>
  );
}
