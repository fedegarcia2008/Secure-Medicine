import { useState } from 'react';
import { Text, View, StyleSheet, TextInput, Pressable, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import SelectorSexo from '../../components/SelectorSexo';
import { supabase } from '../../services/Supabase';
import { generarCodigo } from '../../components/generarCodigo';

export default function Login() {
  const router = useRouter();

  // Si es true, muestra el login simple (email + contraseña)
  // en vez del formulario de registro
  const [modoLogin, setModoLogin] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [apodo, setApodo] = useState('');
  const [email, setEmail] = useState('');
  const [sexo, setSexo] = useState('');
  const [anio, setAnio] = useState('');
  const [contrasena, setContrasena] = useState('');

  const handleRegistrarse = async () => {
    if (!apodo.trim() || !email.trim() || !contrasena.trim()) {
      Alert.alert('Faltan datos', 'Completá apodo, email y contraseña');
      return;
    }

    const anioActual = new Date().getFullYear();
    const anioNum = parseInt(anio, 10);
    if (!anio.trim() || isNaN(anioNum) || anioNum < 1900 || anioNum > anioActual) {
      Alert.alert(
        'Año inválido',
        `Ingresá un año de nacimiento entre 1900 y ${anioActual}`
      );
      return;
    }

    setCargando(true);

    // 1) Crear el usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: contrasena,
    });

    if (error) {
      setCargando(false);
      Alert.alert('Error al registrarse', error.message);
      return;
    }

    // 2) Guardar los datos extra en la tabla "perfiles", con un código
    //    único generado al azar (reintenta si por casualidad ya existe)
    const userId = data.user?.id;
    if (userId) {
      const MAX_INTENTOS = 5;
      let codigoFinal = null;
      let errorFinal = null;

      for (let intento = 0; intento < MAX_INTENTOS; intento++) {
        const codigo = generarCodigo();

        const { error: errorPerfil } = await supabase.from('perfiles').insert({
          id: userId,
          apodo: apodo.trim(),
          sexo: sexo || null,
          anio_nacimiento: anioNum,
          codigo,
        });

        if (!errorPerfil) {
          codigoFinal = codigo;
          break;
        }

        // Código 23505 = violación de restricción "unique" en Postgres.
        // Si es por otro motivo, no tiene sentido reintentar.
        const esColision = errorPerfil.code === '23505';
        if (!esColision) {
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
      router.replace('/');
      return;
    }

    setCargando(false);
    router.replace('/');
  };

  const handleLogin = async () => {
    if (!email.trim() || !contrasena.trim()) {
      Alert.alert('Error', 'Completá email y contraseña');
      return;
    }

    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: contrasena,
    });
    setCargando(false);

    if (error) {
      Alert.alert('Error al ingresar', error.message);
      return;
    }

    router.replace('/');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Secure Medicine</Text>

      {/* --- Formulario de registro --- */}
      {!modoLogin && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Apodo"
            placeholderTextColor="#999"
            value={apodo}
            onChangeText={setApodo}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.row}>
            <SelectorSexo value={sexo} onValueChange={setSexo} />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="Año de nacimiento"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={4}
              value={anio}
              onChangeText={setAnio}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#999"
            secureTextEntry
            value={contrasena}
            onChangeText={setContrasena}
          />

          <Pressable
            style={[styles.button, cargando && styles.buttonDisabled]}
            onPress={handleRegistrarse}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Registrarse</Text>
            )}
          </Pressable>
        </View>
      )}

      {/* --- Login simple con email y contraseña --- */}
      {modoLogin && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#999"
            secureTextEntry
            value={contrasena}
            onChangeText={setContrasena}
          />
          <Pressable
            style={[styles.button, cargando && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Ingresar</Text>
            )}
          </Pressable>
        </View>
      )}

      <Pressable onPress={() => setModoLogin(!modoLogin)}>
        <Text style={styles.link}>
          {modoLogin
            ? '¿No tenés cuenta? Registrate'
            : '¿Ya tenés cuenta? Login con Email y contraseña'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 25,
    paddingTop: 60,
    backgroundColor: '#f5f7fa',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    marginTop: 5,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    textAlign: 'center',
    color: '#4CAF50',
    marginTop: 20,
    fontSize: 14,
  },
});