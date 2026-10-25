import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Text from '../../components/Texto';
import { useColores, useEstilos } from '../../context/ColorContext';
import {
  OPCIONES_TAMANO,
  useTamanoLetra,
} from '../../context/TamanoLetraContext';

export default function TamanoLetra() {
  const { primario, texto } = useColores();
  const styles = useEstilos(crearEstilos);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { opcionActual, setTamano } = useTamanoLetra();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 32 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={texto} />
        </TouchableOpacity>

        <Text style={styles.title}>Tamaño de letra</Text>

        <Text style={styles.subtitle}>
          Elegí qué tan grande querés ver el texto en toda la app.
        </Text>

        <Text style={styles.sectionLabel}>Vista previa</Text>

        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.previewIcon}>
              <Text style={styles.previewEmoji}>💊</Text>
            </View>

            <View style={styles.previewHeaderText}>
              <Text style={styles.previewLabel}>Medicamento</Text>
              <Text style={styles.previewNombre}>Ibuprofeno</Text>
            </View>
          </View>

          <View style={styles.separador} />

          <Text style={styles.previewLabel}>Cada cuánto se toma</Text>
          <Text style={styles.previewValue}>Cada 8 horas</Text>
        </View>

        <Text style={styles.sectionLabel}>Tamaño</Text>

        <View style={styles.card}>
          {OPCIONES_TAMANO.map((opcion, index) => {
            const activo = opcion.key === opcionActual.key;
            const ultimo = index === OPCIONES_TAMANO.length - 1;

            return (
              <TouchableOpacity
                key={opcion.key}
                style={[styles.row, !ultimo && styles.rowDivider]}
                onPress={() => setTamano(opcion.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.rowLabel, activo && styles.rowLabelActive]}
                >
                  {opcion.label}
                </Text>

                {activo && (
                  <Ionicons name="checkmark" size={22} color={primario} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const crearEstilos = ({
  primario,
  primarioSuave,
  fondo,
  tarjeta,
  texto,
  textoMedio,
  textoSuave,
  borde,
  fondoSecundario,
}) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: fondo,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: fondoSecundario,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      color: texto,
      fontSize: 28,
      fontWeight: '700',
      marginTop: 24,
    },
    subtitle: {
      color: textoSuave,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 6,
    },
    sectionLabel: {
      color: textoMedio,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 24,
      marginBottom: 10,
      marginLeft: 2,
    },
    previewCard: {
      backgroundColor: tarjeta,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: borde,
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    previewIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: primarioSuave,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    previewEmoji: {
      fontSize: 26,
    },
    previewHeaderText: {
      flex: 1,
    },
    previewLabel: {
      color: textoSuave,
      fontSize: 13,
      marginBottom: 3,
    },
    previewNombre: {
      color: texto,
      fontSize: 20,
      fontWeight: '700',
    },
    previewValue: {
      color: texto,
      fontSize: 15,
      fontWeight: '600',
    },
    separador: {
      height: 1,
      backgroundColor: borde,
      marginVertical: 16,
    },
    card: {
      backgroundColor: tarjeta,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: borde,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: borde,
    },
    rowLabel: {
      color: texto,
      fontSize: 16,
      fontWeight: '500',
    },
    rowLabelActive: {
      color: primario,
      fontWeight: '700',
    },
  });