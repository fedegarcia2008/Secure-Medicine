import { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { medicamentos } from '../../data/medicamentos';

export default function BuscarMedicamento() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');

  const resultados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return [];
    return medicamentos.filter((m) =>
      m.nombre.toLowerCase().includes(texto)
    );
  }, [busqueda]);

  const handleSeleccionar = (item) => {
    // Acá se navega a la pantalla de "agregarFrecuencia" pasando el medicamento elegido
    router.push({ pathname: '/agregarFrecuencia', params: { id: item.id } });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="Buscar medicamento"
          placeholderTextColor="#999"
          value={busqueda}
          onChangeText={setBusqueda}
          autoFocus
        />

        {busqueda.length > 0 ? (
          <Pressable onPress={() => setBusqueda('')} hitSlop={10}>
            <Ionicons name="close" size={24} color="#333" />
          </Pressable>
        ) : (
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={24} color="#333" />
          </Pressable>
        )}
      </View>

      {/* Contenido */}
      {busqueda.trim() === '' ? (
        <View style={styles.emptyState}>
          <Text style={styles.emoji}>💊</Text>
          <Text style={styles.emptyText}>
            Escriba el nombre del medicamento, la vitamina o el suplemento que
            desea agregar a Terapia
          </Text>
        </View>
      ) : (
        <FlatList
          data={resultados}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emoji}>🔍</Text>
              <Text style={styles.emptyText}>
                No se encontraron resultados para "{busqueda}"
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.resultCard}
              onPress={() => handleSeleccionar(item)}
            >
              <View style={styles.resultIcon}>
                <Text style={{ fontSize: 20 }}>💊</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultNombre}>{item.nombre}</Text>
                {item.categoria ? (
                  <Text style={styles.resultCategoria}>{item.categoria}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#bbb" />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 55,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#222',
    paddingVertical: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f8fa',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  resultCategoria: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});