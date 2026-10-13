import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../services/Supabase';
import { generarCodigo } from '../../components/generarCodigo';
import CampoContrasena from '../../components/CampoContrasena';

const VERDE = '#4CAF50';

export default function CrearCuenta() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  const [apodo, setApodo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [apodoEnfocado, setApodoEnfocado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleCrearCuenta = async () => {
    if (!apodo.trim()) {
      Alert.alert('Falta el apodo', 'Ingresá tu apodo.');
      return;
    }

    if (contrasena.length < 6) {
      Alert.alert('Contraseña muy corta', 'Tiene que tener al menos 6 caracteres.');
      return;
    }

    if (contrasena !== confirmar) {
      Alert.alert('Las contraseñas no coinciden', 'Revisá que sean iguales.');
      return;
    }

    setCargando(true);

    // 1) Crear el usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password: contrasena,
    });

    if (error) {
      setCargando(false);
      Alert.alert('Error al registrarse', error.message);
      return;
    }

    // 2) Guardar el perfil con un código único (reintenta si hay colisión)
    const userId = data.user?.id;

    if (!userId) {
      setCargando(false);
      router.replace('/home');
      return;
    }

    const MAX_INTENTOS = 5;
    let codigoFinal = null;
    let errorFinal = null;

    for (let intento = 0; intento < MAX_INTENTOS; intento++) {
      const codigo = generarCodigo();

      const { error: errorPerfil } = await supabase.from('perfiles').insert({
        id: userId,
        apodo: apodo.trim(),
        codigo,
      });

      if (!errorPerfil) {
        codigoFinal = codigo;
        break;
      }

      // 23505 = violación de "unique" en Postgres. Si es otro error, no reintentamos.
      if (errorPerfil.code !== '23505') {
        errorFinal = errorPerfil;
        break;
      }
    }

    setCargando(false);

    if (!codigoFinal) {
      Alert.alert(
        'Error al guardar el perfil',
        errorFinal?.message || 'No se pudo generar un código único, probá de nuevo'
      );
      return;
    }

    Alert.alert('¡Listo!', `Tu código es: ${codigoFinal}\nGuardalo para compartirlo.`);
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.botonAtras}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>

          <Text style={styles.titulo}>Crea tu cuenta en Secure Medicine</Text>
          <Text style={styles.subtitulo}>
            Empecemos con tu apodo y una contraseña segura.
          </Text>

          <Text style={styles.label}>Apodo</Text>
          <TextInput
            style={[styles.input, apodoEnfocado && styles.inputEnfocado]}
            placeholder="Tu apodo"
            placeholderTextColor="#999"
            value={apodo}
            onChangeText={setApodo}
            onFocus={() => setApodoEnfocado(true)}
            onBlur={() => setApodoEnfocado(false)}
            returnKeyType="next"
          />

          <Text style={[styles.label, styles.labelSeparado]}>Contraseña</Text>
          <CampoContrasena
            value={contrasena}
            onChangeText={setContrasena}
            placeholder="Mínimo 6 caracteres"
            returnKeyType="next"
          />

          <Text style={[styles.label, styles.labelSeparado]}>Confirmar contraseña</Text>
          <CampoContrasena
            value={confirmar}
            onChangeText={setConfirmar}
            placeholder="Repite tu contraseña"
            returnKeyType="done"
            onSubmitEditing={handleCrearCuenta}
          />
        </ScrollView>

        <View style={[styles.barraInferior, { paddingBottom: 16 + insets.bottom }]}>
          <Pressable
            style={[styles.boton, cargando && styles.botonDeshabilitado]}
            onPress={handleCrearCuenta}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.botonTexto}>Crear cuenta</Text>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
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
    lineHeight: 34,
  },
  subtitulo: {
    color: '#555',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 24,
  },
  label: {
    color: '#555',
    fontSize: 14,
    marginBottom: 8,
  },
  labelSeparado: {
    marginTop: 18,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111',
  },
  inputEnfocado: {
    borderColor: VERDE,
    borderWidth: 2,
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