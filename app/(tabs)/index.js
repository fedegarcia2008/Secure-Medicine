import { useMemo, useState } from 'react';
import { Text, View, StyleSheet, Pressable, FlatList, Image } from 'react-native';
import { Link } from 'expo-router';
import SearchBar from '../../components/SearchBar';
import { medicamentos } from '../../data/medicamentos';

export default function Home() {
  const [busqueda, setBusqueda] = useState('');

  const medicamentosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return medicamentos;
    return medicamentos.filter((m) =>
      m.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [busqueda]);

  return (
    <View style={styles.container}>
     
      <View style={styles.header}>
        <View style={styles.logoContainer}>

          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoPlaceholderText}>LOGO</Text>
          </View>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Secure Medicine</Text>
          <Text style={styles.subtitle}>No te olvides de tomar tus medicamentos</Text>
        </View>
      </View>

      {/* Buscador */}
      <SearchBar value={busqueda} onChangeText={setBusqueda} />

      {/* Lista de medicamentos */}
      <FlatList
        data={medicamentosFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No se encontraron medicamentos</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.medicine}>{item.nombre}</Text>
            <Text style={styles.info}>
              {item.categoria}
            </Text>
          </View>
        )}
      />

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    fontSize: 9,
    color: '#999',
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 30,
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