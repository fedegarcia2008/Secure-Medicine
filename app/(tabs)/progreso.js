
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../services/Supabase';

const PRIMARY = '#4caf50';

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

function convertirHoraAMinutos(horaTexto) {
  if (!horaTexto) return null;

  const texto = String(horaTexto).trim().toUpperCase();
  const match = texto.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);

  if (!match) return null;

  let horas = parseInt(match[1], 10);
  const minutos = parseInt(match[2], 10);
  const periodo = match[3];

  if (periodo === 'PM' && horas < 12) horas += 12;
  if (periodo === 'AM' && horas === 12) horas = 0;

  if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
    return null;
  }

  return horas * 60 + minutos;
}

function calcularHorariosDelDia(horaInicio, frecuencia, frecuenciaHoras) {
  if (!horaInicio) return ['08:00'];

  const minutosInicio = convertirHoraAMinutos(horaInicio);

  if (minutosInicio === null) {
    return [horaInicio];
  }

  let intervalo = Number(frecuenciaHoras) || 24;

  if (!frecuenciaHoras && frecuencia) {
    const matchFrecuencia = String(frecuencia).match(/(\d+)/);

    if (matchFrecuencia) {
      const numero = parseInt(matchFrecuencia[1], 10);

      if ([1, 2, 3, 4, 6, 8, 12, 24].includes(numero)) {
        intervalo = numero;
      }
    }
  }

  if (!intervalo || intervalo <= 0 || intervalo > 24) {
    intervalo = 24;
  }

  const tomasPorDia = Math.floor(24 / intervalo);
  const horarios = [];

  for (let i = 0; i < tomasPorDia; i++) {
    const minutosCalculados =
      (minutosInicio + i * intervalo * 60) % 1440;

    const horas = Math.floor(minutosCalculados / 60);
    const minutos = minutosCalculados % 60;

    horarios.push(
      `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
    );
  }

  return horarios;
}

function obtenerEstadoVentana(horaToma) {
  const minutosToma = convertirHoraAMinutos(horaToma);

  if (minutosToma === null) {
    return {
      disponible: false,
      estado: 'invalida',
      mensaje: 'Horario inválido',
    };
  }

  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  let diferencia = minutosAhora - minutosToma;

  if (diferencia < -720) {
    diferencia += 1440;
  } else if (diferencia > 720) {
    diferencia -= 1440;
  }

  if (diferencia < -30) {
    return {
      disponible: false,
      estado: 'futura',
      mensaje: 'Disponible 30 min antes',
    };
  }

  if (diferencia > 60) {
    return {
      disponible: false,
      estado: 'vencida',
      mensaje: 'Ventana vencida',
    };
  }

  return {
    disponible: true,
    estado: 'disponible',
    mensaje: 'Marcar como tomada',
  };
}

export default function Progreso() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [medicamentos, setMedicamentos] = useState([]);
  const [tomasDelDia, setTomasDelDia] = useState({});
  const [cargando, setCargando] = useState(true);
  const [ahora, setAhora] = useState(new Date());

  const cargarDatos = async () => {
    setCargando(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: medsData, error: medsError } = await supabase
        .from('medicamentos')
        .select('*')
        .eq('perfil_id', user.id)
        .eq('en_tratamiento', true);

      if (medsError) {
        console.log(
          'Error cargando medicamentos:',
          medsError.message
        );
      } else {
        setMedicamentos(medsData || []);
      }

      const datosTomas = await AsyncStorage.getItem(getClaveHoy());

      setTomasDelDia(datosTomas ? JSON.parse(datosTomas) : {});
    } catch (error) {
      console.log('Error al cargar datos en Progreso:', error);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos();

      const intervalo = setInterval(() => {
        setAhora(new Date());
      }, 60000);

      return () => clearInterval(intervalo);
    }, [])
  );

  const alternarToma = async (
    idMed,
    hora,
    disponible,
    tomada
  ) => {
    if (!disponible && !tomada) {
      Alert.alert(
        'Toma no disponible',
        'Solo podés marcar el medicamento desde 30 minutos antes hasta 1 hora después del horario indicado.'
      );

      return;
    }

    const claveToma = `${idMed}_${hora}`;
    const nuevoEstado = !tomasDelDia[claveToma];

    const nuevasTomas = {
      ...tomasDelDia,
      [claveToma]: nuevoEstado,
    };

    setTomasDelDia(nuevasTomas);

    try {
      await AsyncStorage.setItem(
        getClaveHoy(),
        JSON.stringify(nuevasTomas)
      );
    } catch (error) {
      console.log('Error guardando la toma:', error);

      Alert.alert(
        'Error',
        'No se pudo guardar el estado de la toma.'
      );
    }
  };

  const listaTomasProcesada = [];

  medicamentos.forEach((med, medIndex) => {
    const idMed = med.id || `${med.nombre}-${medIndex}`;

    const horarios = calcularHorariosDelDia(
      med.hora,
      med.frecuencia,
      med.frecuencia_horas
    );

    horarios.forEach((horario) => {
      const claveToma = `${idMed}_${horario}`;
      const tomada = !!tomasDelDia[claveToma];
      const ventana = obtenerEstadoVentana(horario);

      listaTomasProcesada.push({
        idMed,
        nombreMed: med.nombre || 'Medicamento',
        dosis: med.dosis || '1',
        frecuencia: med.frecuencia || 'Diario',
        hora: horario,
        tomada,
        disponible: ventana.disponible,
        estadoVentana: ventana.estado,
        mensajeVentana: ventana.mensaje,
      });
    });
  });

  const minutosAhora =
    ahora.getHours() * 60 + ahora.getMinutes();

  const tomasVisibles = listaTomasProcesada
    .filter((item) => {
      const minutosToma = convertirHoraAMinutos(item.hora);

      if (minutosToma === null) return false;

      let diferencia = minutosAhora - minutosToma;

      if (diferencia < -720) {
        diferencia += 1440;
      } else if (diferencia > 720) {
        diferencia -= 1440;
      }

      // Oculta las tomas que ya vencieron.
      return diferencia <= 60;
    })
    .sort((a, b) => {
      const minutosA = convertirHoraAMinutos(a.hora);
      const minutosB = convertirHoraAMinutos(b.hora);

      return minutosA - minutosB;
    });

  const totalTomas = tomasVisibles.length;

  const tomasCompletadas = tomasVisibles.filter(
    (item) => item.tomada
  ).length;

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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tomas de Hoy</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 110 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>
            Progreso diario
          </Text>

          <Text style={styles.subtitle}>
            Podés marcar cada medicamento desde 30 minutos antes hasta 1 hora después del horario indicado.
          </Text>

          {cargando ? (
            <ActivityIndicator
              size="large"
              color={PRIMARY}
              style={styles.loading}
            />
          ) : medicamentos.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>💊</Text>

              <Text style={styles.emptyTitle}>
                Sin medicamentos registrados
              </Text>

              <Text style={styles.emptyText}>
                Agregá medicamentos en la sección “Terapia” para ver tus horarios de toma aquí.
              </Text>
            </View>
          ) : tomasVisibles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>✅</Text>

              <Text style={styles.emptyTitle}>
                No hay más tomas pendientes
              </Text>

              <Text style={styles.emptyText}>
                Las tomas anteriores ya finalizaron y las próximas aparecerán según su horario.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.resumenCard}>
                <View style={styles.resumenHeader}>
                  <Text style={styles.resumenTitle}>
                    Cumplimiento visible
                  </Text>

                  <Text style={styles.resumenPorcentaje}>
                    {porcentaje}%
                  </Text>
                </View>

                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${porcentaje}%` },
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

              <Text style={styles.subheadTitle}>
                Próximas tomas
              </Text>

              {tomasVisibles.map((item, idx) => {
                const bloqueada =
                  !item.disponible && !item.tomada;

                return (
                  <TouchableOpacity
                    key={`${item.idMed}_${item.hora}_${idx}`}
                    style={[
                      styles.tomaCard,
                      item.tomada &&
                        styles.tomaCardCompletada,
                      bloqueada &&
                        styles.tomaCardBloqueada,
                    ]}
                    onPress={() =>
                      alternarToma(
                        item.idMed,
                        item.hora,
                        item.disponible,
                        item.tomada
                      )
                    }
                    activeOpacity={bloqueada ? 1 : 0.7}
                  >
                    <View style={styles.tomaHoraBox}>
                      <Text style={styles.clockEmoji}>⏰</Text>

                      <Text
                        style={[
                          styles.tomaHoraText,
                          item.tomada &&
                            styles.textTomado,
                          bloqueada &&
                            styles.textBloqueado,
                        ]}
                      >
                        {item.hora} hs
                      </Text>
                    </View>

                    <View style={styles.tomaInfoBox}>
                      <Text
                        style={[
                          styles.tomaNombre,
                          item.tomada &&
                            styles.textTomado,
                          bloqueada &&
                            styles.textBloqueado,
                        ]}
                      >
                        {item.nombreMed}
                      </Text>

                      <Text style={styles.tomaSubtext}>
                        {item.dosis} comprimido(s) •{' '}
                        {item.frecuencia}
                      </Text>

                      {!item.tomada && (
                        <Text
                          style={[
                            styles.ventanaText,
                            item.estadoVentana ===
                              'vencida' &&
                              styles.ventanaVencida,
                          ]}
                        >
                          {item.mensajeVentana}
                        </Text>
                      )}
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        item.tomada
                          ? styles.badgeTomado
                          : item.disponible
                          ? styles.badgeDisponible
                          : styles.badgePendiente,
                      ]}
                    >
                      <Text style={styles.statusEmoji}>
                        {item.tomada
                          ? '✅'
                          : item.disponible
                          ? '💊'
                          : '🔒'}
                      </Text>

                      <Text
                        style={[
                          styles.statusText,
                          item.tomada &&
                            styles.statusTextTomado,
                          item.disponible &&
                            !item.tomada &&
                            styles.statusTextDisponible,
                        ]}
                      >
                        {item.tomada
                          ? 'Tomado'
                          : item.disponible
                          ? 'Tomar'
                          : 'Esperar'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>

        <View
          style={[
            styles.tabBar,
            { paddingBottom: 12 + insets.bottom },
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
    marginTop: 4,
    marginBottom: 16,
  },
  loading: {
    marginTop: 40,
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
    color: '#1A1D1E',
  },
  resumenPorcentaje: {
    fontSize: 20,
    fontWeight: '800',
    color: PRIMARY,
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
    color: '#6C757D',
  },
  metricaBold: {
    color: '#1A1D1E',
    fontWeight: '700',
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
  tomaCardBloqueada: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.75,
  },
  tomaHoraBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 12,
  },
  clockEmoji: {
    fontSize: 16,
  },
  tomaHoraText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1D1E',
  },
  tomaInfoBox: {
    flex: 1,
  },
  tomaNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1D1E',
  },
  tomaSubtext: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  ventanaText: {
    fontSize: 11,
    color: PRIMARY,
    fontWeight: '600',
    marginTop: 4,
  },
  ventanaVencida: {
    color: '#E53935',
  },
  textTomado: {
    color: PRIMARY,
  },
  textBloqueado: {
    color: '#777777',
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
    backgroundColor: '#F0F0F0',
  },
  badgeDisponible: {
    backgroundColor: '#FFF8E1',
  },
  badgeTomado: {
    backgroundColor: PRIMARY,
  },
  statusEmoji: {
    fontSize: 13,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  statusTextDisponible: {
    color: '#9A7200',
  },
  statusTextTomado: {
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#1A1D1E',
    fontSize: 16,
    fontWeight: '700',
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
