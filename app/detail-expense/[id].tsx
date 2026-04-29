import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, CreditCard, Edit3, Hash, Repeat, Tag, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from '../../Colors';
import { supabase } from '../../lib/supabase';

export default function ExpenseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(true);
  const [gasto, setGasto] = useState<any>(null);

  useEffect(() => {
    fetchExpenseDetail();
  }, []);

  const fetchExpenseDetail = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
                *,
                categories(name, icon_name, color_hex),
                payment_methods(alias, last_four),
                expense_splits(share_amount, is_paid, external_contacts(name))
            `)
      .eq('id', id)
      .single();

    if (!error) setGasto(data);
    setLoading(false);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (!gasto) return <Text>Gasto no encontrado</Text>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header con Monto Principal */}
      <View style={[styles.header, { backgroundColor: gasto.categories?.color_hex || theme.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/edit-expense/${id}`)} style={styles.editBtn}>
          <Edit3 color="white" size={24} />
        </TouchableOpacity>

        <Text style={styles.amount}>${gasto.amount.toFixed(2)}</Text>
        <Text style={styles.description}>{gasto.description}</Text>
      </View>

      <View style={styles.content}>
        {/* Detalles Rápidos */}
        <DetailItem icon={<Tag size={20} color={theme.subtext} />} label="Categoría" value={gasto.categories?.name} theme={theme} />
        <DetailItem icon={<CreditCard size={20} color={theme.subtext} />} label="Método de Pago" value={`${gasto.payment_methods?.alias} (*${gasto.payment_methods?.last_four})`} theme={theme} />
        <DetailItem icon={<Calendar size={20} color={theme.subtext} />} label="Fecha" value={new Date(gasto.created_at).toLocaleDateString()} theme={theme} />

        {/* Info de MSI o Recurrencia */}
        {gasto.is_installment && (
          <DetailItem icon={<Hash size={20} color="#F59E0B" />} label="Plan de Cuotas" value={`${gasto.number_of_installments} Meses`} theme={theme} />
        )}
        {gasto.is_recurring && (
          <DetailItem icon={<Repeat size={20} color="#3B82F6" />} label="Periodicidad" value={`Cobro ${gasto.recurrence_period}`} theme={theme} />
        )}

        {/* Sección de Deuda (Hermano/Externo) */}
        {gasto.expense_splits?.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <View style={styles.sectionHeader}>
              <Users size={18} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Deuda Compartida</Text>
            </View>
            {gasto.expense_splits.map((split: any, index: number) => (
              <View key={index} style={styles.splitRow}>
                <Text style={{ color: theme.text }}>{split.external_contacts?.name}</Text>
                <Text style={{ color: split.is_paid ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>
                  ${split.share_amount} ({split.is_paid ? 'Pagado' : 'Pendiente'})
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Ticket/Imagen */}
        <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Comprobante</Text>
        {gasto.ticket_url ? (
          <Image
            source={{ uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tickets/${gasto.ticket_url}` }}
            style={styles.ticketImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={{ color: theme.subtext, fontStyle: 'italic' }}>Sin ticket adjunto</Text>
        )}
      </View>
    </ScrollView>
  );
}

// Componente auxiliar para filas de detalle
const DetailItem = ({ icon, label, value, theme }: any) => (
  <View style={styles.detailItem}>
    <View style={styles.iconWrapper}>{icon}</View>
    <View>
      <Text style={{ color: theme.subtext, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 16, fontWeight: '500' }}>{value || 'N/A'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backBtn: { position: 'absolute', left: 20, top: 40 },
  editBtn: { position: 'absolute', right: 20, top: 40 },
  amount: { fontSize: 42, fontWeight: '900', color: 'white', marginTop: 20 },
  description: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  content: { padding: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconWrapper: { marginRight: 15, width: 40, alignItems: 'center' },
  section: { padding: 15, borderRadius: 15, marginTop: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionTitle: { fontWeight: 'bold' },
  splitRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  label: { fontWeight: 'bold', marginBottom: 10 },
  ticketImage: { width: '100%', height: 300, borderRadius: 15, backgroundColor: '#eee' }
});
