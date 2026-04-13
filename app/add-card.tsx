import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from '../Colors';
import { supabase } from '../lib/supabase';

export default function AddCard() {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? 'light'];
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState({
		alias: '',
		lastFour: '',
		cardCategory: 'debito',
		closureDay: '',
		dueDay: '',
	});

	const onSave = async () => {
		// ... validaciones previas ...

		setLoading(true);
		try {
			const { data: { session } } = await supabase.auth.getSession();

			// Aseguramos que los valores sean números enteros o NULL
			const closureDay = form.cardCategory === 'credito' ? parseInt(form.closureDay) : null;
			const dueDay = form.cardCategory === 'credito' ? parseInt(form.dueDay) : null;

			const { error } = await supabase.from('payment_methods').insert([{
				user_id: session?.user.id,
				alias: form.alias,
				last_four: form.lastFour,
				card_category: form.cardCategory,
				type: 'tarjeta',
				// Solo enviamos el número si es válido, si no, enviamos null
				// @ts-ignore
				statement_closure_day: isNaN(closureDay) ? null : closureDay,
				// @ts-ignore
				payment_due_day: isNaN(dueDay) ? null : dueDay,
			}]);

			if (error) throw error;
			router.back();
		} catch (e) {
			// @ts-ignore
			alert("Error al guardar: " + e.message);
		} finally {
			setLoading(false);
		}
	};


	return (
		<ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
			<Text style={[styles.label, { color: theme.text }]}>Nombre de la Tarjeta</Text>
			<TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholderTextColor={theme.subtext} placeholder="Ej. Visa Oro" onChangeText={(t) => setForm({ ...form, alias: t })} />

			<Text style={[styles.label, { color: theme.text }]}>Últimos 4 dígitos</Text>
			<TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholderTextColor={theme.subtext} placeholder="1234" keyboardType="numeric" maxLength={4} onChangeText={(t) => setForm({ ...form, lastFour: t })} />

			<Text style={[styles.label, { color: theme.text }]}>Categoría</Text>
			<View style={[styles.row, { backgroundColor: theme.card }]}>
				{['debito', 'credito'].map(cat => (
					<TouchableOpacity
						key={cat}
						style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }, form.cardCategory === cat && { backgroundColor: theme.primary, borderColor: theme.primary }]}
						onPress={() => setForm({ ...form, cardCategory: cat })}
					>
						<Text style={{ color: form.cardCategory === cat ? 'white' : theme.text }}>{cat.toUpperCase()}</Text>
					</TouchableOpacity>
				))}
			</View>

			{form.cardCategory === 'credito' && (
				<View style={styles.row}>
					<View style={{ flex: 1, marginRight: 10 }}>
						<Text style={[styles.label, { color: theme.text }]}>Día Corte</Text>
						<TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="1-31" keyboardType="numeric" onChangeText={(t) => setForm({ ...form, closureDay: t })} />
					</View>
					<View style={{ flex: 1 }}>
						<Text style={[styles.label, { color: theme.text }]}>Día Pago</Text>
						<TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="1-31" keyboardType="numeric" onChangeText={(t) => setForm({ ...form, dueDay: t })} />
					</View>
				</View>
			)}

			<TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={onSave} disabled={loading}>
				<Check color="white" size={20} />
				<Text style={styles.saveBtnText}>{loading ? 'Guardando...' : 'Guardar'}</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20, backgroundColor: '#fff' },
	label: { fontSize: 14, fontWeight: '700', marginBottom: 8, color: '#374151' },
	input: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 12, marginBottom: 20 },
	row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
	chip: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#E5E7EB', alignItems: 'center' },
	chipActive: { backgroundColor: '#3B82F6' },
	saveBtn: { backgroundColor: '#10B981', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 20 },
	saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
