import { useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Text from '../../components/Texto';
import { useColores, useEstilos } from '../../context/ColorContext';
import { medicamentos } from '../../data/medicamentos';

const DANGER = '#E53935';

export default function AgregarFrecuencia() {
  const { primario, texto, textoSuave } = useColores();
  const styles = useEstilos(crearEstilos);
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
          <Ionicons name="arrow-back" size={22} color={texto} />
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
          {frecuencias.map((frecuencia, index) => (
            <Pressable
              key={frecuencia}
              style={[
                styles.opcion,
                index === frecuencias.length - 1 && styles.opcionUltima,
              ]}
              onPress={() => seleccionarFrecuencia(frecuencia)}
            >
              <View style={styles.opcionIcon}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={primario}
                />
              </View>

              <Text style={styles.opcionTexto}>
                {frecuencia}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={textoSuave}
              />
            </Pressable>
          ))}
        </View>

      </ScrollView>
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
  fondoSecundario,
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: fondo,
    },

    header: {
      paddingTop: 50,
      paddingHorizontal: 16,
      paddingBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: borde,
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: fondoSecundario,
      alignItems: 'center',
      justifyContent: 'center',
    },

    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 20,
      fontWeight: '700',
      color: texto,
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
      backgroundColor: tarjeta,
      borderWidth: 1,
      borderColor: borde,
      borderRadius: 16,
      padding: 16,
      marginBottom: 28,
    },

    medicamentoIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: primarioSuave,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },

    emoji: {
      fontSize: 26,
    },

    label: {
      fontSize: 12,
      color: textoSuave,
      marginBottom: 3,
    },

    nombre: {
      fontSize: 19,
      fontWeight: '700',
      color: texto,
    },

    categoria: {
      fontSize: 13,
      color: textoSuave,
      marginTop: 3,
    },

    title: {
      fontSize: 24,
      fontWeight: '700',
      color: texto,
      marginBottom: 6,
    },

    subtitle: {
      fontSize: 14,
      color: textoSuave,
      lineHeight: 20,
      marginBottom: 20,
    },

    opciones: {
      backgroundColor: tarjeta,
      borderWidth: 1,
      borderColor: borde,
      borderRadius: 16,
      overflow: 'hidden',
    },

    opcion: {
      minHeight: 62,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: borde,
    },

    opcionUltima: {
      borderBottomWidth: 0,
    },

    opcionIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: primarioSuave,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    opcionTexto: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: texto,
    },

    error: {
      margin: 30,
      fontSize: 18,
      color: DANGER,
      textAlign: 'center',
    },
  });