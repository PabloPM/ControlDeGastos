import { DynamicIcon } from '@/components/Icon';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { PlusCircle } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from '../../Colors';
import { supabase } from '../../lib/supabase';

// Definir tipos
interface Category {
  name: string;
  icon_name: string;
  color_hex: string;
}

interface PaymentMethod {
  id: string;
  alias: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  is_installment: boolean;
  payment_method_id: string;
  categories: Category | null;
  payment_methods: PaymentMethod | null;
}

interface Totales {
  totalMes: number;
  soloMSI: number;
  soloDirecto: number;
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [gastos, setGastos] = useState<Expense[]>([]);
  const [metodos, setMetodos] = useState<PaymentMethod[]>([]);
  const [filtroMetodo, setFiltroMetodo] = useState<string>('todos');
  const [totales, setTotales] = useState<Totales>({ totalMes: 0, soloMSI: 0, soloDirecto: 0 });
  const [loading, setLoading] = useState<boolean>(true);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [filtroMetodo]) // Se recarga al cambiar el filtro
  );

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // 1. Cargar Catálogo de Métodos de Pago
    // @ts-ignore
    const { data: meths } = await supabase.from('payment_methods').select('id, alias').eq('user_id', user.id);
    setMetodos(meths || []);

    // 2. Consulta de Gastos con Filtro
    let query = supabase
      .from('expenses')
      .select(`id, description, amount, created_at, is_installment, payment_method_id,
              categories(name, icon_name, color_hex), payment_methods(alias)`)
      .order('created_at', { ascending: false });

    if (filtroMetodo !== 'todos') {
      query = query.eq('payment_method_id', filtroMetodo);
    }

    const { data: expData } = await query;

    // 3. Consulta de MSI (Siempre del usuario total para el resumen)
    const { data: cuotasMSI } = await supabase
      .from('installment_plans')
      .select('installment_amount, expenses!inner(payer_id)')
      .eq('is_active', true)
      .eq('expenses.payer_id', user?.id);

    const msi = cuotasMSI?.reduce((acc, curr) => acc + curr.installment_amount, 0) || 0;
    const directo = expData?.filter(g => !g.is_installment && g.created_at >= primerDiaMes)
      .reduce((acc, curr) => acc + curr.amount, 0) || 0;

    // @ts-ignore
    setGastos(expData || []);
    setTotales({ totalMes: msi + directo, soloMSI: msi, soloDirecto: directo });
    setLoading(false);
  };


  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: theme.background }} size="large" color={theme.primary} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={gastos}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <>
            <View style={styles.headerRow}>
              <Text style={[styles.header, { color: theme.text }]}>Mis gastos</Text>
              <Link href="/add-expense" asChild>
                <Pressable style={{ marginRight: 15 }}>
                  <PlusCircle size={28} color="#3B82F6" />
                </Pressable>
              </Link>
            </View>

            <View style={[styles.totalCard, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#111827' }]}>
              <Text style={styles.totalLabel}>Total este mes</Text>
              <Text style={styles.totalAmount}>${totales.totalMes.toFixed(2).toLocaleString()}</Text>
              <View style={styles.row}>
                <Text style={styles.subText}>Gastos: ${totales.soloDirecto.toFixed(2).toLocaleString()}</Text>
                <Text style={styles.subText}>MSI: ${totales.soloMSI.toFixed(2).toLocaleString()}</Text>
              </View>
            </View>

            {/* FILTRO POR MÉTODO DE PAGO */}
            <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Filtrar por tarjeta</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }, filtroMetodo === 'todos' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setFiltroMetodo('todos')}
              >
                <Text style={{ color: filtroMetodo === 'todos' ? 'white' : theme.text }}>Todos</Text>
              </TouchableOpacity>
              {metodos.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }, filtroMetodo === m.id && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => setFiltroMetodo(m.id)}
                >
                  <Text style={{ color: filtroMetodo === m.id ? 'white' : theme.text }}>{m.alias}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

          </>
        )}
        renderItem={({ item }) => {
          // @ts-ignore
          const Icono = Icons[item.categories?.icon_name] || Icons.HelpCircle;
          return (
            <TouchableOpacity
              style={[styles.gastoItem, { backgroundColor: theme.card }]}
              onPress={() => router.push(`/edit-expense/${item.id}`)}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.categories?.color_hex + '25' }]}>
                <DynamicIcon
                  name={item.categories?.icon_name || 'help-circle'}
                  color={item.categories?.color_hex || theme.text}
                  size={22} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text numberOfLines={1} style={[styles.gastoDesc, { color: theme.text }]}>{item.description}</Text>
                <Text numberOfLines={1} style={[styles.gastoMeta, { color: theme.subtext }]}>{item.payment_methods?.alias}</Text>
              </View>
              <Text style={[styles.gastoMonto, { color: theme.text }]}>${item.amount.toFixed(2).toLocaleString()}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { fontSize: 26, fontWeight: 'bold', },
  totalCard: { padding: 25, borderRadius: 24, marginBottom: 20 },
  totalLabel: { color: '#94A3B8', fontSize: 11, textTransform: 'uppercase' },
  totalAmount: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  subText: { color: '#CBD5E1', fontSize: 13 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  filterScroll: { flexDirection: 'row', marginBottom: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  chartCard: { padding: 20, borderRadius: 24, marginBottom: 20, elevation: 1 },
  chartTitle: { fontWeight: 'bold', marginBottom: 10 },
  gastoItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, marginBottom: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  gastoDesc: { fontWeight: '600', fontSize: 15 },
  gastoMeta: { fontSize: 12 },
  gastoMonto: { fontWeight: 'bold', fontSize: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 15 }
});
