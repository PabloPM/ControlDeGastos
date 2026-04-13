import { useFocusEffect, useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { PieChart } from "react-native-gifted-charts";
import { Colors } from '../../Colors';
import { supabase } from '../../lib/supabase';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [gastos, setGastos] = useState([]);
  const [metodos, setMetodos] = useState([]);
  const [filtroMetodo, setFiltroMetodo] = useState('todos');
  const [totales, setTotales] = useState({ totalMes: 0, soloMSI: 0, soloDirecto: 0 });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [filtroMetodo]) // Se recarga al cambiar el filtro
  );

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // 1. Cargar Catálogo de Métodos de Pago
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
      .eq('expenses.payer_id', user.id);

    const msi = cuotasMSI?.reduce((acc, curr) => acc + curr.installment_amount, 0) || 0;
    const directo = expData?.filter(g => !g.is_installment && g.created_at >= primerDiaMes)
      .reduce((acc, curr) => acc + curr.amount, 0) || 0;

    setGastos(expData || []);
    setTotales({ totalMes: msi + directo, soloMSI: msi, soloDirecto: directo });
    setLoading(false);
  };

  const dataGrafica = Object.values(gastos.reduce((acc, g) => {
    const cat = g.categories?.name || 'Otros';
    if (!acc[cat]) acc[cat] = { value: 0, color: g.categories?.color_hex, text: cat };
    acc[cat].value += parseFloat(g.amount);
    return acc;
  }, {}));

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: theme.background }} size="large" color={theme.primary} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={gastos}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <>
            <Text style={[styles.header, { color: theme.text }]}>Mi Resumen</Text>

            <View style={[styles.totalCard, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#111827' }]}>
              <Text style={styles.totalLabel}>Total este mes</Text>
              <Text style={styles.totalAmount}>${totales.totalMes.toLocaleString()}</Text>
              <View style={styles.row}>
                <Text style={styles.subText}>Gastos: ${totales.soloDirecto}</Text>
                <Text style={styles.subText}>MSI: ${totales.soloMSI}</Text>
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

            <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>Distribución</Text>
              <View style={{ alignItems: 'center' }}>
                <PieChart
                  data={dataGrafica} donut radius={60} innerRadius={45}
                  innerCircleColor={theme.card}
                  centerLabelComponent={() => <Text style={{ color: theme.text, fontSize: 10 }}>Gastos</Text>}
                />
              </View>
            </View>
          </>
        )}
        renderItem={({ item }) => {
          const Icono = Icons[item.categories?.icon_name] || Icons.HelpCircle;
          return (
            <TouchableOpacity
              style={[styles.gastoItem, { backgroundColor: theme.card }]}
              onPress={() => router.push(`/edit-expense/${item.id}`)}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.categories?.color_hex + '25' }]}>
                <Icono size={20} color={item.categories?.color_hex} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.gastoDesc, { color: theme.text }]}>{item.description}</Text>
                <Text style={[styles.gastoMeta, { color: theme.subtext }]}>{item.payment_methods?.alias}</Text>
              </View>
              <Text style={[styles.gastoMonto, { color: theme.text }]}>${item.amount}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { fontSize: 26, fontWeight: 'bold', marginTop: 50, marginBottom: 15 },
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
  gastoMonto: { fontWeight: 'bold', fontSize: 15 }
});
