import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
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

  return <View style={[styles.container, { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }]}>
    <Text style={[styles.sectionTitle, { color: theme.text }]}>Ahorita no joven</Text>
  </View>


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
