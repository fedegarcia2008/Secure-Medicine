import { useState } from 'react';
import { Text, View, StyleSheet, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import SelectorSexo from '../../components/SelectorSexo';

export default function Login() {
  const router = useRouter();

  // 'paciente' | 'acompanante' | null
  const [rol, setRol] = useState(null);

  // Si es true, muestra el login simple (email + contraseña)
  // en vez del formulario de registro
  const [modoLogin, setModoLogin] = useState(false);

  const [apodo, setApodo] = useState('');
  const [email, setEmail] = useState('');
  const [sexo, setSexo] = useState('');
  const [anio, setAnio] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [codigoPaciente, setCodigoPaciente] = useState('');

  const handleRegistrarse = () => {
    if (!rol) {
      Alert.alert('Elegí un rol', 'Seleccioná si sos Paciente o Acompañante');
      return;
    }
    if (!apodo.trim() || !email.trim() || !contrasena.trim()) {
      Alert.alert('Faltan datos', 'Completá apodo, email y contraseña');
      return;
    }
    if (rol === 'acompanante' && !codigoPaciente.trim()) {
      Alert.alert('Falta el código', 'Ingresá el código del paciente para vincularte');
      return;
    }

    const anioActual = new Date().getFullYear();          // ← acá
    const anioNum = parseInt(anio, 10);                    // ← acá
    if (!anio.trim() || isNaN(anioNum) || anioNum < 1900 || anioNum > anioActual) {  // ← acá
      Alert.alert(
        'Año inválido',
        `Ingresá un año de nacimiento entre 1900 y ${anioActual}`
      );
      return;
    }

    // Falta conectar con Supabase
    // Si rol === 'paciente' -> después del registro se genera un código
    // para compartir con el acompañante (se muestra primero en Inicio con
    // una (x) para cerrar, y luego queda disponible en Ajustes).
    router.replace('/');
  };

  const handleLogin = () => {
    if (!email.trim() || !contrasena.trim()) {
      Alert.alert('Error', 'Completá email y contraseña');
      return;
    }
    // lógica real de login
    router.replace('/');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Secure Medicine</Text>

      {!modoLogin && (
        <>
          <Text style={styles.subtitle}>Elegí tu rol</Text>

          <View style={styles.rolesRow}>
            <Pressable
              style={[styles.rolCard, rol === 'paciente' && styles.rolCardActive]}
              onPress={() => setRol('paciente')}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>🧑</Text>
              </View>
              <Text style={styles.rolLabel}>Paciente</Text>
            </Pressable>

            <Pressable
              style={[styles.rolCard, rol === 'acompanante' && styles.rolCardActive]}
              onPress={() => setRol('acompanante')}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>🧑‍🤝‍🧑</Text>
              </View>
              <Text style={styles.rolLabel}>Acompañante</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* --- Formulario de registro (solo si eligió un rol) --- */}
      {!modoLogin && rol && (
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

          {rol === 'acompanante' && (
            <TextInput
              style={styles.input}
              placeholder="Código del paciente"
              placeholderTextColor="#999"
              autoCapitalize="characters"
              value={codigoPaciente}
              onChangeText={setCodigoPaciente}
            />
          )}

          <Pressable style={styles.button} onPress={handleRegistrarse}>
            <Text style={styles.buttonText}>Registrarse</Text>
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
          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Ingresar</Text>
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
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  rolesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  rolCard: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
    width: 130,
  },
  rolCardActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#eef8ee',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  rolLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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