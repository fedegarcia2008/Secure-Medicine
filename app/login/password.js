import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../services/Supabase';
import CampoContrasena from '../../components/CampoContrasena';

const VERDE = '#4CAF50';

export default function Password() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleIngresar = async () => {
    if (!contrasena) {
      Alert.alert('Falta la contraseña', 'Ingresá tu contraseña.');
      return;
    }

    setCargando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: contrasena,
    });

    setCargando(false);

    if (error) {
      const mensaje = error.message?.includes('Invalid login')
        ? 'La contraseña es incorrecta.'
        : error.message;

      Alert.alert('No pudimos ingresar', mensaje);
      return;
    }

    router.replace('/home');
  };

  const handleOlvide = () => {
    Alert.alert(
      'Restablecer contraseña',
      `Te enviaremos un correo a ${email} para restablecerla.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            const { error } = await supabase.auth.resetPasswordForEmail(email);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert('Correo enviado', 'Revisá tu bandeja de entrada.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.contenido}>
          <TouchableOpacity
            style={styles.botonAtras}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>

          <Text style={styles.titulo}>Ingresa tu contraseña</Text>
          <Text style={styles.subtitulo}>{email}</Text>

          <Text style={styles.label}>Contraseña</Text>

          <CampoContrasena
            value={contrasena}
            onChangeText={setContrasena}
            placeholder="Ingresa tu contraseña"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleIngresar}
          />

          <TouchableOpacity style={styles.olvide} onPress={handleOlvide}>
            <Text style={styles.olvideTexto}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.barraInferior, { paddingBottom: 16 + insets.bottom }]}>
          <Pressable
            style={[styles.boton, cargando && styles.botonDeshabilitado]}
            onPress={handleIngresar}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.botonTexto}>Ingresar</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  contenido: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  botonAtras: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  titulo: {
    color: '#111',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitulo: {
    color: '#666',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 24,
  },
  label: {
    color: '#555',
    fontSize: 14,
    marginBottom: 8,
  },
  olvide: {
    alignSelf: 'flex-end',
    marginTop: 14,
  },
  olvideTexto: {
    color: '#222',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  barraInferior: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  boton: {
    backgroundColor: VERDE,
    borderRadius: 30,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  botonDeshabilitado: { opacity: 0.6 },
});