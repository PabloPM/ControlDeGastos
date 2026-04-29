import { useRouter } from 'expo-router';
import { ChevronRight, Info, LogOut, Shield, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from '../../Colors';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? 'light'];
	const router = useRouter();
	const [profile, setProfile] = useState<{ name: string, email: string } | null>(null);

	useEffect(() => {
		fetchUserProfile();
	}, []);

	const fetchUserProfile = async () => {
		const { data: { user } } = await supabase.auth.getUser();
		if (user) {
			const { data } = await supabase
				.from('users')
				.select('name, email')
				.eq('id', user.id)
				.single();
			setProfile(data);
		}
	};

	const handleSignOut = async () => {
		Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres salir?', [
			{ text: 'Cancelar', style: 'cancel' },
			{
				text: 'Salir',
				style: 'destructive',
				onPress: async () => {
					await supabase.auth.signOut();
					router.replace('/login');
				}
			},
		]);
	};

	return (
		<View style={[styles.container, { backgroundColor: theme.background }]}>
			<Text style={[styles.header, { color: theme.text }]}>Ajustes</Text>

			{/* Perfil del Usuario */}
			<View style={[styles.profileCard, { backgroundColor: theme.card }]}>
				<View style={styles.avatarCircle}>
					<User size={30} color={theme.primary} />
				</View>
				<View style={{ flex: 1 }}>
					<Text style={[styles.userName, { color: theme.text }]}>{profile?.name || 'Cargando...'}</Text>
					<Text style={[styles.userEmail, { color: theme.subtext }]}>{profile?.email}</Text>
				</View>
			</View>

			{/* Opciones de la App */}
			<View style={styles.menuGroup}>
				<MenuOption icon={<Shield size={20} color={theme.subtext} />} title="Privacidad y Seguridad" theme={theme} />
				<MenuOption icon={<Info size={20} color={theme.subtext} />} title="Información de la App" theme={theme} />
			</View>

			{/* Botón de Cerrar Sesión */}
			<TouchableOpacity
				style={[styles.signOutBtn, { borderColor: '#EF4444' }]}
				onPress={handleSignOut}
			>
				<LogOut size={20} color="#EF4444" />
				<Text style={styles.signOutText}>Cerrar Sesión</Text>
			</TouchableOpacity>

			<Text style={styles.versionText}>Versión 1.0.0</Text>
		</View>
	);
}

// Componente pequeño para las filas del menú
const MenuOption = ({ icon, title, theme }: any) => (
	<TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]}>
		{icon}
		<Text style={[styles.menuText, { color: theme.text }]}>{title}</Text>
		<ChevronRight size={18} color={theme.subtext} />
	</TouchableOpacity>
);

const styles = StyleSheet.create({
	container: { flex: 1, padding: 25 },
	header: { fontSize: 26, fontWeight: 'bold', marginTop: 40, marginBottom: 30 },
	profileCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, marginBottom: 30 },
	avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#3B82F620', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
	userName: { fontSize: 18, fontWeight: 'bold' },
	userEmail: { fontSize: 14 },
	menuGroup: { marginBottom: 40 },
	menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
	menuText: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '500' },
	signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 15, borderWidth: 1, gap: 10 },
	signOutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
	versionText: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 20 }
});
