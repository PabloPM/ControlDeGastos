import { useLocalSearchParams, useRouter } from 'expo-router';
import { Mail, Search, UserPlus } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from '../Colors';
import { supabase } from '../lib/supabase';

export default function AddGroupMember() {
	const { groupId, groupName } = useLocalSearchParams();
	const router = useRouter();
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? 'light'];

	const [email, setEmail] = useState('');
	const [foundUser, setFoundUser] = useState<any>(null);
	const [searching, setSearching] = useState(false);
	const [adding, setAdding] = useState(false);

	// Buscar usuario por correo electrónico
	const buscarUsuario = async () => {
		if (!email.includes('@')) return Alert.alert('Error', 'Introduce un correo válido');

		setSearching(true);
		setFoundUser(null);

		const { data, error } = await supabase
			.from('users')
			.select('id, name, email')
			.eq('email', email.toLowerCase().trim())
			.single();

		if (error || !data) {
			Alert.alert('No encontrado', 'No hay ningún usuario registrado con ese correo.');
		} else {
			setFoundUser(data);
		}
		setSearching(false);
	};

	// Agregar el usuario encontrado a la tabla de miembros del grupo
	const agregarAlGrupo = async () => {
		setAdding(true);
		try {
			const { error } = await supabase
				.from('group_members')
				.insert([{
					user_id: foundUser.id,
					group_id: groupId,
					role: 'member'
				}]);

			if (error) {
				if (error.code === '23505') throw new Error('Este usuario ya es miembro del grupo.');
				throw error;
			}

			Alert.alert('¡Éxito!', `${foundUser.name} ha sido añadido a ${groupName}`);
			router.back();
		} catch (e: any) {
			Alert.alert('Error', e.message);
		} finally {
			setAdding(false);
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: theme.background }]}>
			<Text style={[styles.title, { color: theme.text }]}>Invitar a {groupName}</Text>
			<Text style={[styles.subtitle, { color: theme.subtext }]}>
				Busca a tus amigos por el correo con el que se registraron en la app.
			</Text>

			<View style={styles.searchSection}>
				<View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
					<Mail size={20} color={theme.subtext} style={{ marginRight: 10 }} />
					<TextInput
						style={[styles.input, { color: theme.text }]}
						placeholder="correo@ejemplo.com"
						placeholderTextColor={theme.subtext}
						keyboardType="email-address"
						autoCapitalize="none"
						value={email}
						onChangeText={setEmail}
					/>
				</View>
				<TouchableOpacity
					style={[styles.searchBtn, { backgroundColor: theme.primary }]}
					onPress={buscarUsuario}
					disabled={searching}
				>
					{searching ? <ActivityIndicator color="white" /> : <Search color="white" size={20} />}
				</TouchableOpacity>
			</View>

			{foundUser && (
				<View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.primary + '40' }]}>
					<View style={styles.userInfo}>
						<Text style={[styles.userName, { color: theme.text }]}>{foundUser.name}</Text>
						<Text style={[styles.userEmail, { color: theme.subtext }]}>{foundUser.email}</Text>
					</View>
					<TouchableOpacity
						style={[styles.addBtn, { backgroundColor: theme.primary }]}
						onPress={agregarAlGrupo}
						disabled={adding}
					>
						{adding ? (
							<ActivityIndicator color="white" />
						) : (
							<><UserPlus color="white" size={20} /><Text style={styles.addText}>Añadir</Text></>
						)}
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 25 },
	title: { fontSize: 24, fontWeight: 'bold', marginTop: 10 },
	subtitle: { fontSize: 14, marginTop: 8, marginBottom: 30, lineHeight: 20 },
	searchSection: { flexDirection: 'row', gap: 10, marginBottom: 30 },
	inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderRadius: 15, borderWidth: 1 },
	input: { flex: 1, height: 55, fontSize: 16 },
	searchBtn: { width: 60, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 2 },
	resultCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWeight: 1, borderWidth: 1 },
	userInfo: { flex: 1 },
	userName: { fontSize: 18, fontWeight: 'bold' },
	userEmail: { fontSize: 14, marginTop: 2 },
	addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12 },
	addText: { color: 'white', fontWeight: 'bold' }
});
