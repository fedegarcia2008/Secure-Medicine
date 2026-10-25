import { useMemo, useState } from 'react';
import { View, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Text from '../../components/Texto';
import { useColores, useEstilos } from '../../context/ColorContext';
import { medicamentos } from '../../data/medicamentos';

export default function BuscarMedicamento() {
  const { texto, textoSuave } = useColores();
  const styles = useEstilos(crearEstilos);
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');

  const resultados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return [];
    return medicamentos.filter((m) =>
      m.nombre.toLowerCase().includes(termino)
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
          <Ionicons name="arrow-back" size={24} color={texto} />
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="Buscar medicamento"
          placeholderTextColor={textoSuave}
          value={busqueda}
          onChangeText={setBusqueda}
          autoFocus
        />

        {busqueda.length > 0 ? (
          <Pressable onPress={() => setBusqueda('')} hitSlop={10}>
            <Ionicons name="close" size={24} color={texto} />
          </Pressable>
        ) : (
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={24} color={texto} />
          </Pressable>
        )}
      </View>

      {/* Contenido */}
      {busqueda.trim() === '' ? (
        <View style={styles.emptyState}>
          <Text style={styles.emoji}>💊</Text>
          <Text style={styles.emptyText}>
            Escriba el nombre del medicamento, la vitamina o el suplemento que
            desea agregar a su terapia
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
              <Ionicons name="chevron-forward" size={20} color={textoSuave} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const crearEstilos = ({
  primarioSuave,
  fondo,
  tarjeta,
  texto,
  textoSuave,
  borde,
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: fondo,
      paddingTop: 55,
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: borde,
    },
    input: {
      flex: 1,
      fontSize: 17,
      color: texto,
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
      color: texto,
      textAlign: 'center',
      lineHeight: 22,
    },
    resultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tarjeta,
      borderWidth: 1,
      borderColor: borde,
      padding: 14,
      borderRadius: 12,
      marginBottom: 10,
      gap: 12,
    },
    resultIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: primarioSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultNombre: {
      fontSize: 16,
      fontWeight: '700',
      color: texto,
    },
    resultCategoria: {
      fontSize: 13,
      color: textoSuave,
      marginTop: 2,
    },
  });