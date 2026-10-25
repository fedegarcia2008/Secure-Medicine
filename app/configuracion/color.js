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
import {
  COLORES_DISPONIBLES,
  useColorElegido,
  useColores,
  useEstilos,
} from '../../context/ColorContext';

export default function ColorPrincipal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { primario, texto } = useColores();
  const styles = useEstilos(crearEstilos);
  const { colorActual, setColor } = useColorElegido();

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

        <Text style={styles.title}>Color principal</Text>

        <Text style={styles.subtitle}>
          Elegí el color que se usa en botones, íconos y detalles de toda la app.
        </Text>

        <Text style={styles.sectionLabel}>Vista previa</Text>

        <View style={styles.previewCard}>
          <View style={styles.previewRow}>
            <View style={styles.previewIcon}>
              <Ionicons name="medkit-outline" size={24} color={primario} />
            </View>

            <View style={styles.previewChip}>
              <Text style={styles.previewChipText}>Mi Terapia</Text>
            </View>
          </View>

          <View style={styles.previewButton}>
            <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.previewButtonText}>Añadir</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Colores</Text>

        <View style={styles.grid}>
          {COLORES_DISPONIBLES.map((color) => {
            const activo = color.key === colorActual.key;

            return (
              <TouchableOpacity
                key={color.key}
                style={styles.swatchItem}
                onPress={() => setColor(color.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.swatchRing, activo && styles.swatchRingActive]}
                >
                  <View
                    style={[styles.swatch, { backgroundColor: color.primario }]}
                  >
                    {activo && (
                      <Ionicons name="checkmark" size={26} color="#FFFFFF" />
                    )}
                  </View>
                </View>

                <Text
                  style={[
                    styles.swatchName,
                    activo && styles.swatchNameActive,
                  ]}
                >
                  {color.nombre}
                </Text>
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
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    previewIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: primarioSuave,
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewChip: {
      backgroundColor: primario,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 18,
    },
    previewChipText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
    },
    previewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 8,
      backgroundColor: primario,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 28,
      marginTop: 16,
    },
    previewButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: tarjeta,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: borde,
      padding: 12,
    },
    swatchItem: {
      width: '33.33%',
      alignItems: 'center',
      paddingVertical: 12,
    },
    swatchRing: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 3,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    swatchRingActive: {
      borderColor: primario,
    },
    swatch: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
    },
    swatchName: {
      marginTop: 8,
      fontSize: 13,
      fontWeight: '600',
      color: textoMedio,
    },
    swatchNameActive: {
      color: primario,
      fontWeight: '700',
    },
  });