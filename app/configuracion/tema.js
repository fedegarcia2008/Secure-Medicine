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
  OPCIONES_TEMA,
  useColorElegido,
  useColores,
  useEstilos,
} from '../../context/ColorContext';

export default function Tema() {
  const { primario, texto } = useColores();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useEstilos(crearEstilos);
  const { modo, setModo } = useColorElegido();

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

        <Text style={styles.title}>Tema</Text>

        <Text style={styles.subtitle}>
          Elegí cómo querés ver la app. El cambio se aplica al instante.
        </Text>

        <View style={styles.card}>
          {OPCIONES_TEMA.map((opcion, index) => {
            const activo = opcion.key === modo;
            const ultimo = index === OPCIONES_TEMA.length - 1;

            return (
              <TouchableOpacity
                key={opcion.key}
                style={[styles.row, !ultimo && styles.rowDivider]}
                onPress={() => setModo(opcion.key)}
                activeOpacity={0.7}
              >
                <View style={styles.rowIcon}>
                  <Ionicons name={opcion.icono} size={20} color={primario} />
                </View>

                <View style={styles.rowTextos}>
                  <Text
                    style={[styles.rowLabel, activo && styles.rowLabelActive]}
                  >
                    {opcion.label}
                  </Text>

                  <Text style={styles.rowDescripcion}>
                    {opcion.descripcion}
                  </Text>
                </View>

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

const crearEstilos = ({ primario, primarioSuave, fondo, tarjeta, texto, textoMedio, textoSuave, borde, fondoSecundario, fondoInput, peligroSuave }) =>
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
      marginBottom: 24,
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
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: borde,
    },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: primarioSuave,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    rowTextos: {
      flex: 1,
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
    rowDescripcion: {
      color: textoSuave,
      fontSize: 13,
      marginTop: 2,
    },
  });