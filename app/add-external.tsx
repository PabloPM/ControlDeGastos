import { useRouter } from 'expo-router';
import { Check, UserPlus } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from '../Colors';
import { supabase } from '../lib/supabase';

export default function AddExternalContact() {
	const router = useRouter();
	const [name, setName] = useState('');
	const [alias, setAlias] = useState('');
	const [loading, setLoading] = useState(false);
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? 'light'];

	const onSave = async () => {
		if (!name) {
			Alert.alert('Error', 'El nombre es obligatorio');
			return;
		}

		setLoading(true);
		try {
			const { data: { user } } = await supabase.auth.getUser();

			const { error } = await supabase.from('external_contacts').insert([{
				owner_id: user?.id,
				name: name,
				alias: alias || 'Familiar',
			}]);

			if (error) throw error;
			router.back();
		} catch (e) {
			Alert.alert('Error', e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: theme.background }]}>
			<View style={styles.iconHeader}>
				<UserPlus size={40} color="#3B82F6" />
			</View>

			<Text style={[styles.label, { color: theme.text }]}>Nombre completo</Text>
			<TextInput
				style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
				placeholder="Ej. Juan Pérez"
				placeholderTextColor={theme.subtext}
				value={name}
				onChangeText={setName}
			/>

			<Text style={[styles.label, { color: theme.text }]}>Alias o Parentesco (Opcional)</Text>
			<TextInput
				style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
				placeholder="Ej. Hermano, Amigo de la oficina"
				placeholderTextColor={theme.subtext}
				value={alias}
				onChangeText={setAlias}
			/>

			<TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={onSave} disabled={loading}>
				<Check color="white" size={20} />
				<Text style={[styles.saveBtnText, { color: theme.buttonText }]}>{loading ? 'Guardando...' : 'Crear Contacto'}</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 30, backgroundColor: '#fff' },
	iconHeader: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
	label: { fontSize: 14, fontWeight: '700', color: '#4B5563', marginBottom: 8 },
	input: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 20 },
	saveBtn: { backgroundColor: '#3B82F6', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 },
	saveBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
