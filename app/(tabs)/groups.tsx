import { useFocusEffect, useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { ArrowRightLeft, UserCircle, UserPlus, Users } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from '../../Colors';
import { supabase } from '../../lib/supabase';

interface Group {
  id: string;
  name: string;
  description?: string | null;
}

interface ExternalContact {
  id: string;
  name: string;
  alias?: string | null;
}

interface ExpenseSplit {
  id: string;
  share_amount: number;
  expenses: {
    description: string;
    created_at: string;
  };
  external_contacts: {
    name: string;
  };
}

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [externals, setExternals] = useState<ExternalContact[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const router = useRouter();

  const [historialPagos, setHistorialPagos] = useState<ExpenseSplit[]>([]);

  const fetchHistorialPagos = async () => {
    const { data, error } = await supabase
      .from('expense_splits')
      .select(`
        id,
        share_amount,
        expenses (description, created_at),
        external_contacts (name)
      `)
      .eq('is_paid', true) // Solo los ya cobrados
      .not('external_contact_id', 'is', null) // Solo de contactos externos
      .order('id', { ascending: false });

    // @ts-ignore
    if (!error) setHistorialPagos(data || []);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;

    // Consultamos los grupos PERO filtrando a través de group_members
    const { data: grpData, error } = await supabase
      .from('groups')
      .select(`
      *,
      group_members!inner(user_id)
    `)
      .eq('group_members.user_id', userId);

    if (error) console.error('Error cargando grupos:', error.message);

    setGroups(grpData || []);

    // Para los contactos externos, el filtro ya lo teníamos (owner_id)
    const { data: extData } = await supabase
      .from('external_contacts')
      .select('*')
      .eq('owner_id', userId);

    setExternals(extData || []);
    setLoading(false);
  };


  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: theme.text }]}>Grupos y Contactos</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary + '20' }]} onPress={() => router.push('/add-group')}>
          <UserPlus size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* SECCIÓN: GRUPOS COMPARTIDOS */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Grupos Compartidos</Text>
      {groups.map((item) => (
        <TouchableOpacity key={item.id} style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
            <Users size={22} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.itemSub, { color: theme.subtext }]}>{item.description || 'Sin descripción'}</Text>
          </View>
          <ArrowRightLeft size={18} color={theme.subtext} />
        </TouchableOpacity>
      ))}

      {/* SECCIÓN: CONTACTOS EXTERNOS (Tu hermano, etc.) */}
      <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Personas Externas (Deudas)</Text>
      {externals.map((item) => (
        <TouchableOpacity key={item.id} style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
            <UserCircle size={22} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.itemSub, { color: theme.subtext }]}>Deuda personal • {item.alias || 'Familiar'}</Text>
          </View>
          <ArrowRightLeft size={18} color={theme.subtext} />
        </TouchableOpacity>
      ))}

      <View style={styles.historialSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Historial de Pagos Recibidos</Text>
        {historialPagos.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.subtext }]}>Aún no hay pagos registrados.</Text>
        ) : (
          historialPagos.map((pago) => (
            <View key={pago.id} style={styles.historialCard}>
              <View style={styles.checkIcon}>
                <Icons.Check size={16} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pagoNombre, { color: theme.text }]}>{pago.external_contacts.name}</Text>
                <Text style={[styles.pagoConcepto, { color: theme.subtext }]}>{pago.expenses.description}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.pagoMonto, { color: theme.text }]}>+${pago.share_amount}</Text>
                <Text style={[styles.pagoFecha, { color: theme.subtext }]}>
                  {new Date(pago.expenses.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  historialSection: { marginTop: 30, paddingHorizontal: 5 },
  historialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // Gris claro para diferenciar del activo
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    opacity: 0.8
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  pagoNombre: { fontSize: 14, fontWeight: '600', color: '#374151' },
  pagoConcepto: { fontSize: 11, color: '#6B7280' },
  pagoMonto: { fontSize: 14, fontWeight: '700', color: '#059669' },
  pagoFecha: { fontSize: 10, color: '#9CA3AF' },
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  addBtn: { padding: 8, backgroundColor: '#E0E7FF', borderRadius: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 15 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 1
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  itemSub: { fontSize: 13, color: '#6B7280' },
  emptyText: { fontSize: 13, fontStyle: 'italic', color: '#9CA3AF', textAlign: 'center', marginTop: 20 }
});
