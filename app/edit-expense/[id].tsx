import { useLocalSearchParams, useRouter } from 'expo-router';
import { CreditCard, Save, Tag, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function EditExpense() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Catálogos
    const [categories, setCategories] = useState([]);
    const [methods, setMethods] = useState([]);

    const [form, setForm] = useState({
        description: '',
        amount: '',
        categoryId: '',
        methodId: ''
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            // Cargamos el gasto, las categorías y las tarjetas en paralelo
            const [gastoRes, catsRes, methsRes] = await Promise.all([
                supabase.from('expenses').select('*').eq('id', id).single(),
                supabase.from('categories').select('*'),
                supabase.from('payment_methods').select('*')
            ]);

            if (gastoRes.data) {
                setForm({
                    description: gastoRes.data.description,
                    amount: gastoRes.data.amount.toString(),
                    categoryId: gastoRes.data.category_id,
                    methodId: gastoRes.data.payment_method_id
                });
            }
            setCategories(catsRes.data || []);
            setMethods(methsRes.data || []);
        } catch (e) {
            Alert.alert('Error', 'No se pudieron cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const onUpdate = async () => {
        if (!form.amount || !form.methodId) return Alert.alert('Error', 'Monto y método son obligatorios');

        setSaving(true);
        const { error } = await supabase
            .from('expenses')
            .update({
                description: form.description,
                amount: parseFloat(form.amount),
                category_id: form.categoryId,
                payment_method_id: form.methodId
            })
            .eq('id', id);

        if (error) Alert.alert('Error', error.message);
        else router.back();
        setSaving(false);
    };

    const onDelete = async () => {
        Alert.alert('Eliminar', '¿Borrar este gasto permanentemente?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar', style: 'destructive', onPress: async () => {
                    await supabase.from('expenses').delete().eq('id', id);
                    router.back();
                }
            },
        ]);
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#3B82F6" />;

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
                style={styles.input}
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
            />

            <Text style={styles.label}>Monto</Text>
            <TextInput
                style={styles.input}
                value={form.amount}
                keyboardType="numeric"
                onChangeText={(t) => setForm({ ...form, amount: t })}
            />

            {/* Selector de Categoría */}
            <Text style={styles.label}><Tag size={14} /> Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {categories.map(c => (
                    <TouchableOpacity
                        key={c.id}
                        style={[styles.chip, form.categoryId === c.id && styles.chipActive]}
                        onPress={() => setForm({ ...form, categoryId: c.id })}
                    >
                        <Text style={{ color: form.categoryId === c.id ? 'white' : 'black' }}>{c.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Selector de Método de Pago */}
            <Text style={styles.label}><CreditCard size={14} /> Tarjeta / Método</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {methods.map(m => (
                    <TouchableOpacity
                        key={m.id}
                        style={[styles.chip, form.methodId === m.id && styles.chipActive]}
                        onPress={() => setForm({ ...form, methodId: m.id })}
                    >
                        <Text style={{ color: form.methodId === m.id ? 'white' : 'black' }}>{m.alias}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={onUpdate} disabled={saving}>
                <Save color="white" size={20} />
                <Text style={styles.saveText}>{saving ? 'Guardando...' : 'Actualizar Gasto'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
                <Trash2 color="#EF4444" size={20} />
                <Text style={styles.deleteText}>Eliminar Gasto</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: 'white' },
    label: { fontWeight: 'bold', marginBottom: 8, color: '#4B5563', marginTop: 10 },
    input: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 12, marginBottom: 15 },
    chipRow: { flexDirection: 'row', marginBottom: 15 },
    chip: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#E5E7EB', borderRadius: 20, marginRight: 10 },
    chipActive: { backgroundColor: '#3B82F6' },
    saveBtn: { backgroundColor: '#3B82F6', padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 20 },
    saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    deleteBtn: { marginTop: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 10 },
    deleteText: { color: '#EF4444', fontWeight: '600' }
});
