import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';

const PRIMARY = '#4caf50';

const STORAGE_KEY = '@medicamentos_terapia';

const TAB_BAR_ITEMS = [
  { key: 'hoy', label: 'Hoy', icon: 'list-outline', route: '/home' },
  { key: 'progreso', label: 'Progreso', icon: 'stats-chart-outline' },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline' },
  { key: 'terapia', label: 'Terapia', icon: 'medkit-outline' },
];

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha';

  const date = new Date(fecha);

  if (isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return `${date.getDate()} de ${
    MESES[date.getMonth()]
  } de ${date.getFullYear()}`;
}

export default function Terapia() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [medicamentos, setMedicamentos] = useState([]);
  const [tabActiva, setTabActiva] = useState('terapia');

  const cargarMedicamentos = async () => {
    try {
      const datosGuardados = await AsyncStorage.getItem(STORAGE_KEY);

      if (datosGuardados) {
        const datos = JSON.parse(datosGuardados);

        if (Array.isArray(datos)) {
          setMedicamentos(datos);
        }
      } else {
        setMedicamentos([]);
      }
    } catch (error) {
      console.log('Error cargando medicamentos:', error);
      setMedicamentos([]);
    }
  };

  // Cada vez que el usuario entra nuevamente a Terapia, se vuelven a cargar los medicamentos guardados.
  useFocusEffect(
    useCallback(() => {
      cargarMedicamentos();
    }, [])
  );

  const navegarTab = (item) => {
    setTabActiva(item.key);

    if (item.key === 'hoy') {
      router.push('/home');
    }
    // arreglar estar parte
    // if (item.key === 'progreso') router.push('/progreso');
    // if (item.key === 'noticias') router.push('/noticias');
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Terapia</Text>
        </View>

        {/* CONTENIDO */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: 110 + insets.bottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>
            Mis medicamentos
          </Text>

          <Text style={styles.subtitle}>
            Acá podés consultar los medicamentos que tenés registrados en tu terapia.
          </Text>

          {medicamentos.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="medkit-outline"
                  size={30}
                  color={PRIMARY}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No tenés medicamentos registrados
              </Text>

              <Text style={styles.emptyText}>
                Agregá tu primer medicamento para verlo guardado en tu terapia.
              </Text>
            </View>
          ) : (
            medicamentos.map((medicamento, index) => (
              <View
                key={medicamento.id || `${medicamento.nombre}-${index}`}
                style={styles.medicamentoCard}
              >
                {/* Nombre */}
                <View style={styles.medicamentoHeader}>
                  <View style={styles.medicamentoIcon}>
                    <Text style={styles.iconText}>💊</Text>
                  </View>

                  <View style={styles.medicamentoHeaderText}>
                    <Text style={styles.medicamentoLabel}>
                      Medicamento
                    </Text>

                    <Text style={styles.medicamentoNombre}>
                      {medicamento.nombre || 'Sin nombre'}
                    </Text>
                  </View>
                </View>

                <View style={styles.separador} />

                {/* Frecuencia */}
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="repeat-outline"
                      size={20}
                      color={PRIMARY}
                    />
                  </View>

                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>
                      Cada cuánto se toma
                    </Text>

                    <Text style={styles.infoValue}>
                      {medicamento.frecuencia || 'No especificado'}
                    </Text>
                  </View>
                </View>

                {/* Hora */}
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={PRIMARY}
                    />
                  </View>

                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>
                      Hora
                    </Text>

                    <Text style={styles.infoValue}>
                      {medicamento.hora || 'No especificada'}
                    </Text>
                  </View>
                </View>

                {/* Dosis */}
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="medical-outline"
                      size={20}
                      color={PRIMARY}
                    />
                  </View>

                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>
                      Dosis
                    </Text>

                    <Text style={styles.infoValue}>
                      {medicamento.dosis || '1'} comprimido(s)
                    </Text>
                  </View>
                </View>

                {/* Límite */}
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="flask-outline"
                      size={20}
                      color={PRIMARY}
                    />
                  </View>

                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>
                      Límite de dosis
                    </Text>

                    <Text style={styles.infoValue}>
                      {medicamento.limiteDosis || '30'} comprimido(s)
                    </Text>
                  </View>
                </View>

                {/* Fecha */}
                <View style={[styles.infoRow, styles.lastInfoRow]}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={PRIMARY}
                    />
                  </View>

                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>
                      Fecha de inicio
                    </Text>

                    <Text style={styles.infoValue}>
                      {formatearFecha(medicamento.fechaInicio)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* BOTÓN AÑADIR */}
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              bottom: 72 + insets.bottom,
            },
          ]}
          activeOpacity={0.85}
          onPress={() => router.push('/buscador')}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color="#FFFFFF"
          />

          <Text style={styles.addButtonText}>
            Añadir
          </Text>
        </TouchableOpacity>

        {/* TAB BAR */}
        <View
          style={[
            styles.tabBar,
            {
              paddingBottom: 12 + insets.bottom,
            },
          ]}
        >
          {TAB_BAR_ITEMS.map((item) => {
            const activo = item.key === tabActiva;

            return (
              <TouchableOpacity
                key={item.key}
                style={styles.tabItem}
                onPress={() => navegarTab(item)}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={activo ? PRIMARY : '#6C757D'}
                />

                <Text
                  style={[
                    styles.tabLabel,
                    activo && styles.tabLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
  },

  headerTitle: {
    color: '#1A1D1E',
    fontSize: 26,
    fontWeight: '600',
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  sectionTitle: {
    color: '#1A1D1E',
    fontSize: 22,
    fontWeight: '700',
  },

  subtitle: {
    color: '#6C757D',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 18,
  },

  medicamentoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,

    borderWidth: 1,
    borderColor: '#E5E8EB',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },

  medicamentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  medicamentoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAF7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  iconText: {
    fontSize: 26,
  },

  medicamentoHeaderText: {
    flex: 1,
  },

  medicamentoLabel: {
    color: '#888888',
    fontSize: 13,
    marginBottom: 3,
  },

  medicamentoNombre: {
    color: '#1A1D1E',
    fontSize: 20,
    fontWeight: '700',
  },

  separador: {
    height: 1,
    backgroundColor: '#E5E8EB',
    marginVertical: 18,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  lastInfoRow: {
    marginBottom: 0,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  infoTextContainer: {
    flex: 1,
  },

  infoLabel: {
    color: '#888888',
    fontSize: 13,
    marginBottom: 2,
  },

  infoValue: {
    color: '#1A1D1E',
    fontSize: 15,
    fontWeight: '600',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#EAF7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    color: '#1A1D1E',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptyText: {
    color: '#6C757D',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },

  addButton: {
    position: 'absolute',
    right: 20,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 8,

    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 12,

    borderRadius: 28,

    elevation: 4,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',

    width: '100%',

    paddingTop: 12,

    borderTopWidth: 1,
    borderTopColor: '#E5E8EB',

    backgroundColor: '#FFFFFF',
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },

  tabLabel: {
    fontSize: 12,
    color: '#6C757D',
  },

  tabLabelActive: {
    color: PRIMARY,
    fontWeight: '600',
  },
});