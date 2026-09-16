import { useState } from 'react';
import { Text, View, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function Agregar() {
  const [nombre, setNombre] = useState('');
  const [dosis, setDosis] = useState('');
  const [horario, setHorario] = useState('');
  const router = useRouter();

  const handleGuardar = () => {
    if (!nombre.trim() || !dosis.trim() || !horario.trim()) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }

    // Acá va la lógica para guardar en la bdd real
    // (SQLite, Firebase, Supabase, API propia, etc.)
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agregar medicamento</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre del medicamento"
        placeholderTextColor="#999"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Dosis (ej: 1 pastilla)"
        placeholderTextColor="#999"
        value={dosis}
        onChangeText={setDosis}
      />

      <TextInput
        style={styles.input}
        placeholder="Horario (ej: 14:00)"
        placeholderTextColor="#999"
        value={horario}
        onChangeText={setHorario}
      />

      <Pressable style={styles.button} onPress={handleGuardar}>
        <Text style={styles.buttonText}>Guardar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f5f7fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
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
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});