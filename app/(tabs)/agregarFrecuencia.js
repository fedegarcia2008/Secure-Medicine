import { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { medicamentos } from '../../data/medicamentos';

const PRIMARY = '#4CAF50';

export default function AgregarFrecuencia() {
  const router = useRouter();

  const { id } = useLocalSearchParams();

  const medicamento = useMemo(() => {
    return medicamentos.find((m) => String(m.id) === String(id));
  }, [id]);

  const seleccionarFrecuencia = (frecuencia) => {
    router.push({
      pathname: '/recordatorio',
      params: {
        nombre: medicamento?.nombre || 'Medicamento',
        frecuencia,
      },
    });
  };

  if (!medicamento) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>
          No se encontró el medicamento.
        </Text>
      </View>
    );
  }

  const frecuencias = [
    'Cada 4 horas',
    'Cada 6 horas',
    'Cada 8 horas',
    'Cada 12 horas',
    'Una vez al día',
    'Dos veces al día',
    'Tres veces al día',
    'Según indicación médica',
  ];

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>

        <Text style={styles.headerTitle}>
          Frecuencia
        </Text>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* Medicamento seleccionado */}
        <View style={styles.medicamentoCard}>
          <View style={styles.medicamentoIcon}>
            <Text style={styles.emoji}>💊</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>
              Medicamento seleccionado
            </Text>

            <Text style={styles.nombre}>
              {medicamento.nombre}
            </Text>

            <Text style={styles.categoria}>
              {medicamento.categoria}
            </Text>
          </View>
        </View>

        {/* Pregunta */}
        <Text style={styles.title}>
          ¿Cada cuánto lo tomás?
        </Text>

        <Text style={styles.subtitle}>
          Seleccioná la frecuencia indicada para este medicamento.
        </Text>

        {/* Opciones */}
        <View style={styles.opciones}>
          {frecuencias.map((frecuencia) => (
            <Pressable
              key={frecuencia}
              style={styles.opcion}
              onPress={() => seleccionarFrecuencia(frecuencia)}
            >
              <View style={styles.opcionIcon}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={PRIMARY}
                />
              </View>

              <Text style={styles.opcionTexto}>
                {frecuencia}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#bbb"
              />
            </Pressable>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },

  headerSpace: {
    width: 40,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  medicamentoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6f8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },

  medicamentoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#eaf7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  emoji: {
    fontSize: 26,
  },

  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 3,
  },

  nombre: {
    fontSize: 19,
    fontWeight: '700',
    color: '#222',
  },

  categoria: {
    fontSize: 13,
    color: '#888',
    marginTop: 3,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    marginBottom: 20,
  },

  opciones: {
    backgroundColor: '#f5f6f8',
    borderRadius: 16,
    overflow: 'hidden',
  },

  opcion: {
    minHeight: 62,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },

  opcionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eaf7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  opcionTexto: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },

  error: {
    margin: 30,
    fontSize: 18,
    color: '#d32f2f',
    textAlign: 'center',
  },
});