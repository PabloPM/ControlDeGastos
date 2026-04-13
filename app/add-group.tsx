import { useRouter } from 'expo-router';
import { Check, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from '../Colors';
import { supabase } from '../lib/supabase';

export default function AddGroup() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState({ name: '', description: '' });
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? 'light'];

	const onCreateGroup = async () => {
		if (!form.name.trim()) return Alert.alert('Error', 'El nombre del grupo es obligatorio');

		setLoading(true);
		try {
			const { data: { session } } = await supabase.auth.getSession();
			const userId = session?.user.id;

			// 1. Crear el Grupo
			const { data: group, error: groupError } = await supabase
				.from('groups')
				.insert([{ name: form.name, description: form.description }])
				.select()
				.single();

			if (groupError) throw groupError;

			// 2. Agregarte a ti mismo como Admin del grupo
			const { error: memberError } = await supabase
				.from('group_members')
				.insert([{
					user_id: userId,
					group_id: group.id,
					role: 'admin'
				}]);

			if (memberError) throw memberError;

			Alert.alert('¡Éxito!', 'Grupo creado correctamente');
			router.back();
		} catch (e: any) {
			Alert.alert('Error', e.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: theme.background }]}>
			<View style={styles.header}>
				<View style={styles.iconCircle}>
					<Users size={32} color="#4F46E5" />
				</View>
				<Text style={[styles.title, { color: theme.text }]}>Crear Nuevo Grupo</Text>
				<Text style={[styles.subtitle, { color: theme.text }]}>Divide gastos con amigos, pareja o compañeros de casa.</Text>
			</View>

			<Text style={[styles.label, { color: theme.text }]}>Nombre del Grupo</Text>
			<TextInput
				style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
				placeholder="Ej. Viaje a la Playa, Casa 2024..."
				placeholderTextColor={theme.subtext}
				value={form.name}
				onChangeText={(t) => setForm({ ...form, name: t })}
			/>

			<Text style={[styles.label, { color: theme.text }]}>Descripción (Opcional)</Text>
			<TextInput
				style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
				placeholder="Ej. Gastos compartidos del departamento"
				placeholderTextColor={theme.subtext}
				multiline
				numberOfLines={3}
				value={form.description}
				onChangeText={(t) => setForm({ ...form, description: t })}
			/>

			<TouchableOpacity
				style={[styles.saveBtn, loading && { opacity: 0.7 }]}
				onPress={onCreateGroup}
				disabled={loading}
			>
				{loading ? <ActivityIndicator color="white" /> : (
					<>
						<Check size={20} color="white" />
						<Text style={styles.saveText}>Crear Grupo</Text>
					</>
				)}
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 30, backgroundColor: 'white' },
	header: { alignItems: 'center', marginBottom: 40 },
	iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
	title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
	subtitle: { textAlign: 'center', color: '#6B7280', marginTop: 8 },
	label: { fontSize: 14, fontWeight: '700', color: '#4B5563', marginBottom: 8 },
	input: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 20 },
	saveBtn: { backgroundColor: '#4F46E5', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10 },
	saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
