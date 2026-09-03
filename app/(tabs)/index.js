import { Text, View, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>💊 Recordatorios</Text>

      <Text style={styles.subtitle}>
        No te olvides de tomar tus medicamentos
      </Text>

      <View style={styles.card}>
        <Text style={styles.medicine}>Paracetamol</Text>
        <Text style={styles.info}>1 pastilla · 14:00 hs</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.medicine}>Vitamina C</Text>
        <Text style={styles.info}>1 pastilla · 20:00 hs</Text>
      </View>

      <Link href="/agregar" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>+ Agregar medicamento</Text>
        </Pressable>
      </Link>
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  medicine: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    fontSize: 15,
    color: '#666',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});