import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';

const PRIMARY = '#4caf50';
const STORAGE_MEDS_KEY = '@medicamentos_terapia';

const TAB_BAR_ITEMS = [
  { key: 'hoy', label: 'Home', icon: 'list-outline', route: '/Home' },
  { key: 'progreso', label: 'Progreso', icon: 'stats-chart-outline', route: '/progreso' },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline', route: '/noticias' },
  { key: 'terapia', label: 'Terapia', icon: 'medkit-outline', route: '/terapia' },
];

function getClaveHoy() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return `@progreso_${yyyy}-${mm}-${dd}`;
}

function calcularHorariosDelDia(horaInicio, frecuencia) {
  if (!horaInicio) return ['08:00'];

  const matchHora = horaInicio.match(/(\d{1,2}):(\d{2})/);
  if (!matchHora) return [horaInicio];

  let horas = parseInt(matchHora[1], 10);
  const minutos = parseInt(matchHora[2], 10);

  if (horaInicio.toUpperCase().includes('PM') && horas < 12) horas += 12;
  if (horaInicio.toUpperCase().includes('AM') && horas === 12) horas = 0;

  let intervalo = 24;

  if (frecuencia) {
    const matchFreq = frecuencia.match(/(\d+)/);

    if (matchFreq) {
      const num = parseInt(matchFreq[1], 10);

      if ([1, 2, 3, 4, 6, 8, 12].includes(num)) {
        intervalo = num;
      }
    }
  }

  const tomasPorDia = Math.floor(24 / intervalo);
  const listaHorarios = [];

  for (let i = 0; i < tomasPorDia; i++) {
    const horaCalc = (horas + i * intervalo) % 24;
    const hStr = String(horaCalc).padStart(2, '0');
    const mStr = String(minutos).padStart(2, '0');

    listaHorarios.push(`${hStr}:${mStr}`);
  }

  return listaHorarios;
}

export default function Progreso() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [medicamentos, setMedicamentos] = useState([]);
  const [tomasDelDia, setTomasDelDia] = useState({});

  const cargarDatos = async () => {
    try {
      const datosMeds = await AsyncStorage.getItem(STORAGE_MEDS_KEY);
      const listaMeds = datosMeds ? JSON.parse(datosMeds) : [];

      setMedicamentos(Array.isArray(listaMeds) ? listaMeds : []);

      const claveHoy = getClaveHoy();
      const datosTomas = await AsyncStorage.getItem(claveHoy);

      setTomasDelDia(datosTomas ? JSON.parse(datosTomas) : {});
    } catch (error) {
      console.log('Error al cargar datos:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  const alternarToma = async (idMed, hora) => {
    const claveToma = `${idMed}_${hora}`;
    const nuevoEstado = !tomasDelDia[claveToma];

    const nuevasTomas = {
      ...tomasDelDia,
      [claveToma]: nuevoEstado,
    };

    setTomasDelDia(nuevasTomas);

    try {
      const claveHoy = getClaveHoy();

      await AsyncStorage.setItem(
        claveHoy,
        JSON.stringify(nuevasTomas)
      );
    } catch (error) {
      console.log('Error guardando la toma:', error);
      Alert.alert('Error', 'No se pudo guardar el estado de la toma.');
    }
  };

  let totalTomas = 0;
  let tomasCompletadas = 0;
  const listaTomasProcesada = [];

  medicamentos.forEach((med, medIndex) => {
    const idMed = med.id || `${med.nombre}-${medIndex}`;
    const horarios = calcularHorariosDelDia(med.hora, med.frecuencia);

    horarios.forEach((horario) => {
      totalTomas++;

      const tomada = !!tomasDelDia[`${idMed}_${horario}`];

      if (tomada) tomasCompletadas++;

      listaTomasProcesada.push({
        idMed,
        nombreMed: med.nombre || 'Medicamento',
        dosis: med.dosis || '1',
        frecuencia: med.frecuencia || 'Diario',
        hora: horario,
        tomada,
      });
    });
  });

  listaTomasProcesada.sort((a, b) =>
    a.hora.localeCompare(b.hora)
  );

  const porcentaje =
    totalTomas > 0
      ? Math.round((tomasCompletadas / totalTomas) * 100)
      : 0;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tomas de Hoy</Text>
        </View>

        {/* CONTENIDO PRINCIPAL */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 110 + insets.bottom }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Progreso diario</Text>

          <Text style={styles.subtitle}>
            Tocá en cada horario para marcar tus medicamentos como tomados.
          </Text>

          {medicamentos.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>
                💊
              </Text>

              <Text style={styles.emptyTitle}>
                Sin medicamentos registrados
              </Text>

              <Text style={styles.emptyText}>
                Agregá medicamentos en la sección "Terapia" para ver tus horarios de toma aquí.
              </Text>
            </View>
          ) : (
            <>
              {/* RESUMEN */}
              <View style={styles.resumenCard}>
                <View style={styles.resumenHeader}>
                  <Text style={styles.resumenTitle}>
                    Cumplimiento del día
                  </Text>

                  <Text style={styles.resumenPorcentaje}>
                    {porcentaje}%
                  </Text>
                </View>

                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${porcentaje}%` }
                    ]}
                  />
                </View>

                <View style={styles.metricasContainer}>
                  <Text style={styles.metricaText}>
                    Tomadas:{' '}
                    <Text style={styles.metricaBold}>
                      {tomasCompletadas}
                    </Text>
                  </Text>

                  <Text style={styles.metricaText}>
                    Pendientes:{' '}
                    <Text style={styles.metricaBold}>
                      {totalTomas - tomasCompletadas}
                    </Text>
                  </Text>

                  <Text style={styles.metricaText}>
                    Total:{' '}
                    <Text style={styles.metricaBold}>
                      {totalTomas}
                    </Text>
                  </Text>
                </View>
              </View>

              {/* LISTA DE TOMAS */}
              <Text style={styles.subheadTitle}>
                Horarios del día
              </Text>

              {listaTomasProcesada.map((item, idx) => (
                <TouchableOpacity
                  key={`${item.idMed}_${item.hora}_${idx}`}
                  style={[
                    styles.tomaCard,
                    item.tomada && styles.tomaCardCompletada
                  ]}
                  onPress={() =>
                    alternarToma(item.idMed, item.hora)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.tomaHoraBox}>
                    <Text style={{ fontSize: 16 }}>
                      ⏰
                    </Text>

                    <Text
                      style={[
                        styles.tomaHoraText,
                        item.tomada && styles.textTomado
                      ]}
                    >
                      {item.hora} hs
                    </Text>
                  </View>

                  <View style={styles.tomaInfoBox}>
                    <Text
                      style={[
                        styles.tomaNombre,
                        item.tomada && styles.textTomado
                      ]}
                    >
                      {item.nombreMed}
                    </Text>

                    <Text style={styles.tomaSubtext}>
                      {item.dosis} comprimido(s) • {item.frecuencia}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      item.tomada
                        ? styles.badgeTomado
                        : styles.badgePendiente
                    ]}
                  >
                    <Text style={{ fontSize: 13 }}>
                      {item.tomada ? '✅' : '⏳'}
                    </Text>

                    <Text
                      style={[
                        styles.statusText,
                        item.tomada && styles.statusTextTomado
                      ]}
                    >
                      {item.tomada ? 'Tomado' : 'Tomar'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>

        {/* TAB BAR */}
        <View
          style={[
            styles.tabBar,
            { paddingBottom: 12 + insets.bottom }
          ]}
        >
          {TAB_BAR_ITEMS.map((item) => {
            const activo = item.key === 'progreso';

            return (
              <TouchableOpacity
                key={item.key}
                style={styles.tabItem}
                onPress={() => router.replace(item.route)}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={activo ? PRIMARY : '#6C757D'}
                />

                <Text
                  style={[
                    styles.tabLabel,
                    activo && styles.tabLabelActive
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
    backgroundColor: '#F8F9FA'
  },

  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
  },

  headerTitle: {
    color: '#1A1D1E',
    fontSize: 26,
    fontWeight: '600'
  },

  scrollView: {
    flex: 1
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20
  },

  sectionTitle: {
    color: '#1A1D1E',
    fontSize: 22,
    fontWeight: '700'
  },

  subtitle: {
    color: '#6C757D',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 16,
  },

  subheadTitle: {
    color: '#1A1D1E',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 12,
  },

  resumenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    elevation: 2,
  },

  resumenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  resumenTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1D1E'
  },

  resumenPorcentaje: {
    fontSize: 20,
    fontWeight: '800',
    color: PRIMARY
  },

  barBackground: {
    height: 8,
    backgroundColor: '#EAF7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },

  barFill: {
    height: '100%',
    backgroundColor: PRIMARY,
    borderRadius: 4,
  },

  metricasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },

  metricaText: {
    fontSize: 13,
    color: '#6C757D'
  },

  metricaBold: {
    color: '#1A1D1E',
    fontWeight: '700'
  },

  tomaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    elevation: 1,
  },

  tomaCardCompletada: {
    backgroundColor: '#F0F9F1',
    borderColor: '#C8E6C9',
  },

  tomaHoraBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 12,
  },

  tomaHoraText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1D1E'
  },

  tomaInfoBox: {
    flex: 1
  },

  tomaNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1D1E'
  },

  tomaSubtext: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2
  },

  textTomado: {
    color: PRIMARY
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgePendiente: {
    backgroundColor: '#F0F0F0'
  },

  badgeTomado: {
    backgroundColor: PRIMARY
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666'
  },

  statusTextTomado: {
    color: '#FFFFFF'
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },

  emptyTitle: {
    color: '#1A1D1E',
    fontSize: 16,
    fontWeight: '700'
  },

  emptyText: {
    color: '#6C757D',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
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
    gap: 4
  },

  tabLabel: {
    fontSize: 12,
    color: '#6C757D'
  },

  tabLabelActive: {
    color: PRIMARY,
    fontWeight: '600'
  },
});