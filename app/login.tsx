import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  async function handleAuth() {
    setLoading(true);
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) Alert.alert('Error de registro', error.message);
      else Alert.alert('¡Éxito!', 'Revisa tu correo para confirmar tu cuenta.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Error de acceso', error.message);
      else router.replace('/(tabs)'); // Te envía al Dashboard
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? 'Crea tu cuenta' : 'Bienvenido'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> :
          <Text style={styles.buttonText}>{isRegistering ? 'Registrarse' : 'Entrar'}</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{ marginTop: 20 }}>
        <Text style={styles.linkText}>
          {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#1F2937' },
  input: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { backgroundColor: '#3B82F6', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  linkText: { color: '#3B82F6', textAlign: 'center' }
});
