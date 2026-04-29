import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { CalendarClock, Camera, CreditCard, Image as ImageIcon, Save, Tag } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from '../Colors';
import { supabase } from '../lib/supabase';

export default function AddExpense() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [methods, setMethods] = useState([]);
  const [externals, setExternals] = useState([]);
  const [image, setImage] = useState<string | null>(null);

  const [form, setForm] = useState({
    description: '', amount: '', categoryId: '', methodId: '',
    isInstallment: false, installments: '1',
    isRecurring: false, recurrencePeriod: 'mensual',
    externalContactId: null,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;

    const [cats, meths, exts] = await Promise.all([
      supabase.from('categories').select('*').or(`is_default.eq.true,user_id.eq.${userId}`),
      supabase.from('payment_methods').select('*').eq('user_id', userId),
      supabase.from('external_contacts').select('*').eq('owner_id', userId)
    ]);

    setCategories(cats.data || []);
    setMethods(meths.data || []);
    setExternals(exts.data || []);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería para seleccionar imágenes.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  // Cálculo de cuota para el resumen visual
  const cuotaMensual = form.isInstallment && form.amount && form.installments > 0
    ? (parseFloat(form.amount) / parseInt(form.installments)).toFixed(2)
    : null;

  const onSave = async () => {
    if (!form.amount || !form.methodId || !form.description) {
      return Alert.alert('Error', 'Faltan campos obligatorios');
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let ticketUrl = null;

      if (image) {
        const fileExt = image.split('.').pop();
        const fileName = `${session?.user.id}/${Date.now()}.${fileExt}`;
        const formData = new FormData();
        formData.append('file', { uri: image, name: fileName, type: `image/${fileExt}` } as any);
        const { data: storageData, error: sError } = await supabase.storage.from('tickets').upload(fileName, formData);
        console.log('Storage upload response:', { storageData, sError });
        if (sError) throw sError;
        ticketUrl = storageData.path;
      }

      const { data: expense, error: expError } = await supabase.from('expenses').insert([{
        description: form.description,
        amount: parseFloat(form.amount),
        category_id: form.categoryId || null,
        payment_method_id: form.methodId,
        is_installment: form.isInstallment,
        number_of_installments: form.isInstallment ? parseInt(form.installments) : 1,
        is_recurring: form.isRecurring,
        recurrence_period: form.isRecurring ? form.recurrencePeriod : null,
        ticket_url: ticketUrl,
        payer_id: session?.user.id
      }]).select().single();

      if (expError) throw expError;

      if (form.externalContactId) {
        await supabase.from('expense_splits').insert([{
          expense_id: expense.id,
          external_contact_id: form.externalContactId,
          share_amount: parseFloat(form.amount),
          is_paid: false
        }]);
      }

      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 50 }}>
      <Text style={[styles.label, { color: theme.text }]}>Descripción</Text>
      <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="¿Qué compraste?" placeholderTextColor={theme.subtext} onChangeText={t => setForm({ ...form, description: t })} />

      <Text style={[styles.label, { color: theme.text }]}>Monto Total</Text>
      <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor={theme.subtext} onChangeText={t => setForm({ ...form, amount: t })} />

      {/* CATEGORÍAS (RESTAURADO) */}
      <Text style={[styles.label, { color: theme.text }]}><Tag size={14} /> Categoría</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {categories.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }, form.categoryId === c.id && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => setForm({ ...form, categoryId: c.id })}
          >
            <Text style={{ color: form.categoryId === c.id ? 'white' : theme.text }}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* MÉTODOS DE PAGO */}
      <Text style={[styles.label, { color: theme.text }]}><CreditCard size={14} /> Método de Pago</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {methods.map(m => (
          <TouchableOpacity key={m.id} style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }, form.methodId === m.id && { backgroundColor: theme.primary, borderColor: theme.primary }]} onPress={() => setForm({ ...form, methodId: m.id })}>
            <Text style={{ color: form.methodId === m.id ? 'white' : theme.text }}>{m.alias}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* TICKET */}
      <Text style={[styles.label, { color: theme.text }]}><ImageIcon size={14} /> Ticket o Comprobante</Text>
      <TouchableOpacity style={[styles.ticketBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={pickImage}>
        {image ? <Image source={{ uri: image }} style={styles.preview} /> : <Camera size={24} color={theme.subtext} />}
      </TouchableOpacity>

      {/* MSI CON RESUMEN VISUAL */}
      <View style={styles.switchContainer}>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>Meses sin Intereses (MSI)</Text>
          <Switch value={form.isInstallment} onValueChange={v => setForm({ ...form, isInstallment: v })} trackColor={{ true: theme.primary }} />
        </View>
        {form.isInstallment && (
          <View style={styles.msiInfo}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, marginBottom: 10 }]}
              placeholder="Número de meses"
              keyboardType="numeric"
              onChangeText={t => setForm({ ...form, installments: t })}
            />
            {cuotaMensual && (
              <View style={styles.cuotaBadge}>
                <Text style={styles.cuotaText}>Pagarás <Text style={{ fontWeight: 'bold' }}>${cuotaMensual}</Text> cada mes</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* GASTOS DOMICILIADOS */}
      <View style={styles.switchRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <CalendarClock size={20} color={theme.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.switchLabel, { color: theme.text }]}>Gasto Domiciliado</Text>
        </View>
        <Switch value={form.isRecurring} onValueChange={v => setForm({ ...form, isRecurring: v })} trackColor={{ true: theme.primary }} />
      </View>

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={onSave} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <><Save color="white" size={20} /><Text style={styles.saveText}>Guardar Gasto</Text></>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontWeight: 'bold', marginBottom: 8, fontSize: 14, marginTop: 10 },
  input: { padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, borderWidth: 1 },
  chipRow: { flexDirection: 'row', marginBottom: 15 },
  chip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  ticketBtn: { width: '100%', height: 100, borderRadius: 15, borderStyle: 'dashed', borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  preview: { width: '100%', height: '100%' },
  switchContainer: { marginBottom: 15, padding: 10, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.03)' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  switchLabel: { fontSize: 16, fontWeight: '500' },
  msiInfo: { marginTop: 5 },
  cuotaBadge: { backgroundColor: '#3B82F620', padding: 10, borderRadius: 8, alignItems: 'center' },
  cuotaText: { color: '#3B82F6', fontSize: 13 },
  saveBtn: { padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
