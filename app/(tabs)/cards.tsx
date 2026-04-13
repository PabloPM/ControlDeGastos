import { useFocusEffect } from 'expo-router';
import { AlertTriangle, Calendar, CreditCard } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Colors } from '../../Colors';
import { supabase } from '../../lib/supabase';

export default function CardsScreen() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    fetchCards();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCards();
    }, [])
  );

  const fetchCards = async () => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('alias', { ascending: true });

    if (!error) setCards(data);
    setLoading(false);
  };

  const renderCard = ({ item }) => {
    const esCredito = item.card_category === 'credito';
    const hoy = new Date().getDate();

    // Lógica simple: si faltan menos de 5 días para el pago, resaltar
    const proximoAlPago = esCredito && Math.abs(item.payment_due_day - hoy) <= 5;

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: proximoAlPago ? '#EF4444' : theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBg, { backgroundColor: theme.primary + '15' }]}>
            <CreditCard color={proximoAlPago ? "#EF4444" : theme.primary} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.alias, { color: theme.text }]}>{item.alias}</Text>
            <Text style={[styles.digits, { color: theme.subtext }]}>
              **** {item.last_four} • {item.card_category?.toUpperCase()}
            </Text>
          </View>
          {proximoAlPago && <AlertTriangle size={20} color="#EF4444" />}
        </View>

        {esCredito && (
          <View style={[styles.detailsRow, { borderTopColor: theme.border }]}>
            <View style={styles.detail}>
              <Calendar size={14} color={theme.subtext} />
              <Text style={[styles.detailText, { color: theme.subtext }]}>Corte: Día {item.statement_closure_day}</Text>
            </View>
            <Text style={[styles.detailText, { color: proximoAlPago ? '#EF4444' : theme.text, fontWeight: proximoAlPago ? 'bold' : '400' }]}>
              Pago: Día {item.payment_due_day}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={styles.header}>Mis Métodos de Pago</Text>
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        ListEmptyComponent={<Text style={styles.empty}>No has agregado tarjetas aún.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  cardAlert: { borderWidth: 1.5, borderColor: '#FECACA', backgroundColor: '#FFF5F5' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  alias: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  type: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15 },
  dataPoint: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dataText: { fontSize: 13, color: '#4B5563' },
  boldAlert: { color: '#EF4444', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
  iconBg: { padding: 12, borderRadius: 14, marginRight: 15 },
  digits: { fontSize: 13, marginTop: 2 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13 }
});
