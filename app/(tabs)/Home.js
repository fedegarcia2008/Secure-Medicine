import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import QuoteCard from '../../components/Quotecard';
import { supabase } from '../../services/Supabase';
import { useColores, useEstilos } from '../../context/ColorContext';

const logoApp = require('../../assets/images/Secure Medicine.png');
const TAB_BAR_HEIGHT = 56;

//ERROR EN TAMAÑO DE LETRA EN ESTA PANTALLA HOME

const TAB_BAR_ITEMS = [
  { key: 'hoy', label: 'Home', icon: 'list-outline', route: '/Home' },
  { key: 'progreso', label: 'Progreso', icon: 'stats-chart-outline', route: '/progreso' },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline', route: '/noticias' },
  { key: 'terapia', label: 'Terapia', icon: 'medkit-outline', route: '/terapia' },
];

function formatearFecha(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

const HOY_STRING = formatearFecha(new Date());

const obtenerSemana = (fechaRefStr) => {
  const [year, month, day] = fechaRefStr.split('-').map(Number);
  const fechaRef = new Date(year, month - 1, day);
  const diaSemana = fechaRef.getDay();
  const offsetLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const nombresDias = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
  const dias = [];

  for (let i = 0; i < 7; i++) {
    const fecha = new Date(year, month - 1, day + offsetLunes + i);

    dias.push({
      label: nombresDias[fecha.getDay()],
      numero: fecha.getDate(),
      fechaCompleta: formatearFecha(fecha),
    });
  }

  return dias;
};

const obtenerTituloFecha = (fechaStr) => {
  if (fechaStr === formatearFecha(new Date())) return 'Hoy';

  const [year, month, day] = fechaStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);

  const nombresDias = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];

  const mesesNombresCortos = [
    'Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.',
    'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.',
  ];

  return `${nombresDias[fecha.getDay()]}, ${day} ${mesesNombresCortos[fecha.getMonth()]}`;
};

const desplazarFecha = (fechaStr, dias) => {
  const [year, month, day] = fechaStr.split('-').map(Number);

  return formatearFecha(
    new Date(year, month - 1, day + dias)
  );
};

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

  if (minutosInicio === null) return [horaInicio];

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

// Usa el mismo criterio de Progreso: oculta tomas cuyo horario pasó hace más de una hora.
function obtenerDiferenciaMinutos(horaToma, fechaStr) {
  const minutosToma = convertirHoraAMinutos(horaToma);

  if (minutosToma === null) return null;

  // Para una fecha anterior o futura, no aplicamos la hora actual a ese día.
  const hoy = formatearFecha(new Date());

  if (fechaStr !== hoy) return null;

  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  let diferencia = minutosAhora - minutosToma;

  if (diferencia < -720) diferencia += 1440;
  else if (diferencia > 720) diferencia -= 1440;

  return diferencia;
}

function debeMostrarToma(horaToma, fechaStr) {
  // En días distintos de hoy se muestran todas las tomas del día seleccionado.
  if (fechaStr !== formatearFecha(new Date())) return true;

  const diferencia = obtenerDiferenciaMinutos(horaToma, fechaStr);

  if (diferencia === null) return false;

  return diferencia <= 60;
}

export default function HoyScreen() {
  const { primario, textoMedio, textoSuave } = useColores();
  const styles = useEstilos(crearEstilos);

  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [diaSeleccionado, setDiaSeleccionado] = useState(HOY_STRING);
  const [diasVisibles, setDiasVisibles] = useState(obtenerSemana(HOY_STRING));
  const [seccionAbierta, setSeccionAbierta] = useState(true);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [tabActiva, setTabActiva] = useState('hoy');

  const [codigo, setCodigo] = useState(null);
  const [mostrarCodigo, setMostrarCodigo] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [mesVista, setMesVista] = useState(new Date());

  const [medicamentos, setMedicamentos] = useState([]);
  const [tomasDelDia, setTomasDelDia] = useState({});
  const [cargando, setCargando] = useState(true);

  const abrirDetalle = (tarea) => setTareaSeleccionada(tarea);
  const cerrarDetalle = () => setTareaSeleccionada(null);

  const cambiarSemana = (incrementoSemanas) => {
    const primerDiaActual = diasVisibles[0].fechaCompleta;

    setDiasVisibles(
      obtenerSemana(
        desplazarFecha(primerDiaActual, incrementoSemanas * 7)
      )
    );
  };

  const seleccionarDia = (fechaCompleta) => {
    setDiaSeleccionado(fechaCompleta);
  };

  const cargarDatosDia = useCallback(async (fechaStr) => {
    setCargando(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMedicamentos([]);
        setTomasDelDia({});
        return;
      }

      const { data: perfilData } = await supabase
        .from('perfiles')
        .select('codigo')
        .eq('id', user.id)
        .single();

      if (perfilData?.codigo) {
        setCodigo(perfilData.codigo);
      }

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

        setMedicamentos([]);
      } else {
        setMedicamentos(medsData || []);
      }

      const datosTomas = await AsyncStorage.getItem(
        `@progreso_${fechaStr}`
      );

      setTomasDelDia(datosTomas ? JSON.parse(datosTomas) : {});
    } catch (error) {
      console.log('Error cargando datos:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarDatosDia(diaSeleccionado);
    }, [diaSeleccionado, cargarDatosDia])
  );

  const copiarCodigo = async () => {
    if (!codigo) return;

    await Clipboard.setStringAsync(codigo);
    setCopiado(true);

    setTimeout(() => setCopiado(false), 1500);
  };

  const seleccionarFechaCalendario = (fechaStr) => {
    setDiaSeleccionado(fechaStr);
    setDiasVisibles(obtenerSemana(fechaStr));
    setMostrarCalendario(false);
  };

  // Armamos las tomas y usamos el mismo formato de clave que Progreso.
  const listaMedicamentos = medicamentos
    .map((med, medIndex) => {
      const idMed = med.id || `${med.nombre}-${medIndex}`;

      const horariosCompletos = calcularHorariosDelDia(
        med.hora,
        med.frecuencia,
        med.frecuencia_horas
      );

      const horarios = horariosCompletos
        .filter((horario) =>
          debeMostrarToma(horario, diaSeleccionado)
        )
        .sort(
          (a, b) =>
            (convertirHoraAMinutos(a) ?? 0) -
            (convertirHoraAMinutos(b) ?? 0)
        );

      const tomas = horarios.map((horario) => ({
        hora: horario,
        tomada: !!tomasDelDia[`${idMed}_${horario}`],
      }));

      const completadas = tomas.filter(
        (toma) => toma.tomada
      ).length;

      return {
        idMed,
        nombre: med.nombre || 'Medicamento',
        dosis: med.dosis || '1',
        frecuencia: med.frecuencia || 'Diario',
        tomas,
        total: tomas.length,
        completadas,
      };
    })
    .filter((med) => med.total > 0);

  const totalTomasDia = listaMedicamentos.reduce(
    (total, med) => total + med.total,
    0
  );

  const tomasCompletadasDia = listaMedicamentos.reduce(
    (total, med) => total + med.completadas,
    0
  );

  const porcentajeTomas = totalTomasDia > 0
    ? Math.round((tomasCompletadasDia / totalTomasDia) * 100)
    : 0;

  const generarDiasMes = () => {
    const year = mesVista.getFullYear();
    const month = mesVista.getMonth();

    const primerDiaMes = new Date(year, month, 1).getDay();
    const totalDias = new Date(year, month + 1, 0).getDate();

    const desplazamiento =
      primerDiaMes === 0 ? 6 : primerDiaMes - 1;

    const dias = [];

    for (let i = 0; i < desplazamiento; i++) {
      dias.push(null);
    }

    for (let i = 1; i <= totalDias; i++) {
      dias.push({
        numero: i,
        fechaCompleta: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      });
    }

    return dias;
  };

  const cambiarMes = (incremento) => {
    const nuevoMes = new Date(mesVista);

    nuevoMes.setMonth(nuevoMes.getMonth() + incremento);
    setMesVista(nuevoMes);
  };

  const manejarNavegacionTab = (item) => {
    setTabActiva(item.key);

    if (item.route) {
      router.replace(item.route);
    }
  };

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril',
    'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.topContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={logoApp}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.headerTitle}>
              {obtenerTituloFecha(diaSeleccionado)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setMostrarCalendario(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={textoMedio}
            />
          </TouchableOpacity>
        </View>

        {mostrarCodigo && codigo && (
          <View style={styles.codeCard}>
            <View style={styles.codeCardLeft}>
              <Ionicons
                name="key-outline"
                size={18}
                color={primario}
              />

              <Text style={styles.codeCardText}>
                Tu código: {codigo}
              </Text>
            </View>

            <View style={styles.codeCardActions}>
              <TouchableOpacity
                onPress={copiarCodigo}
                style={styles.codeCardButton}
              >
                <Ionicons
                  name={copiado ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={copiado ? primario : textoMedio}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMostrarCodigo(false)}
                style={styles.codeCardButton}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={textoSuave}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.weekNavContainer}>
          <TouchableOpacity
            onPress={() => cambiarSemana(-1)}
            style={styles.navArrow}
            hitSlop={{
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
            }}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={textoSuave}
            />
          </TouchableOpacity>

          <View style={styles.weekColumn}>
            <View
              style={styles.weekDayHeaderRow}
              pointerEvents="none"
            >
              {diasVisibles.map((dia) => (
                <View
                  key={dia.fechaCompleta}
                  style={styles.weekDayHeaderItem}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      dia.fechaCompleta === formatearFecha(new Date()) &&
                        styles.dayLabelHoy,
                    ]}
                  >
                    {dia.label}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.weekRow}>
              {diasVisibles.map((dia) => {
                const esHoy =
                  dia.fechaCompleta === formatearFecha(new Date());

                const esSeleccionado =
                  dia.fechaCompleta === diaSeleccionado;

                return (
                  <TouchableOpacity
                    key={dia.fechaCompleta}
                    style={styles.dayColumn}
                    onPress={() => seleccionarDia(dia.fechaCompleta)}
                  >
                    <View
                      style={[
                        styles.dayCircle,
                        esHoy && styles.dayCircleHoy,
                        esSeleccionado &&
                          !esHoy &&
                          styles.dayCircleSelected,
                        esSeleccionado &&
                          esHoy &&
                          styles.dayCircleHoySelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          esHoy && styles.dayNumberHoy,
                          esSeleccionado &&
                            !esHoy &&
                            styles.dayNumberSelected,
                        ]}
                      >
                        {dia.numero}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => cambiarSemana(1)}
            style={styles.navArrow}
            hitSlop={{
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
            }}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={textoSuave}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={{
          paddingBottom: 100 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setSeccionAbierta((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderContent}>
            <Text style={styles.sectionTitle}>
              Tareas de hoy
            </Text>

            <Text style={styles.tomaDetalle}>
              {tomasCompletadasDia} de {totalTomasDia} tareas realizadas
            </Text>

            <View style={styles.progresoFondo}>
              <View
                style={[
                  styles.progresoRelleno,
                  { width: `${porcentajeTomas}%` },
                ]}
              />
            </View>

            <Text style={styles.porcentajeTexto}>
              {porcentajeTomas}% completado
            </Text>
          </View>

          <Ionicons
            name={seccionAbierta ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={textoMedio}
          />
        </TouchableOpacity>

        {seccionAbierta && (
          <View style={styles.tomasContainer}>
            {cargando ? (
              <ActivityIndicator
                size="small"
                color={primario}
                style={styles.loaderStyle}
              />
            ) : listaMedicamentos.length === 0 ? (
              <View style={styles.emptyTomas}>
                <Text style={styles.emptyTomasText}>
                  No hay tomas para mostrar en este día.
                </Text>
              </View>
            ) : (
              listaMedicamentos.map((item) => {
                const completa =
                  item.total > 0 &&
                  item.completadas === item.total;

                const enCurso =
                  item.completadas > 0 && !completa;

                return (
                  <TouchableOpacity
                    key={item.idMed}
                    style={[
                      styles.tomaBar,
                      completa && styles.tomaBarTomada,
                    ]}
                    onPress={() => abrirDetalle(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.tomaLeft}>
                      <Ionicons
                        name={
                          completa
                            ? 'checkmark-circle'
                            : enCurso
                              ? 'time-outline'
                              : 'ellipse-outline'
                        }
                        size={22}
                        color={completa ? primario : textoSuave}
                      />

                      <View style={styles.tomaInfoText}>
                        <Text
                          style={[
                            styles.tomaNombre,
                            completa && styles.tomaNombreTomada,
                          ]}
                          numberOfLines={1}
                        >
                          {item.nombre} {item.completadas}/{item.total}
                        </Text>

                        <Text style={styles.tomaDetalle}>
                          Dosis: {item.dosis} • {item.frecuencia}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        completa
                          ? styles.badgeTomada
                          : styles.badgePendiente,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          completa && styles.badgeTextTomada,
                        ]}
                      >
                        {completa
                          ? 'Completada'
                          : enCurso
                            ? 'En curso'
                            : 'Pendiente'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        <View style={styles.quoteContainer}>
          <QuoteCard />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.addButton,
          { bottom: TAB_BAR_HEIGHT + insets.bottom + 16 },
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

      <View
        style={[
          styles.tabBar,
          { paddingBottom: 12 + insets.bottom },
        ]}
      >
        {TAB_BAR_ITEMS.map((item) => {
          const activo = item.key === tabActiva;

          return (
            <TouchableOpacity
              key={item.key}
              style={styles.tabItem}
              onPress={() => manejarNavegacionTab(item)}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={activo ? primario : textoSuave}
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

      <Modal
        visible={!!tareaSeleccionada}
        transparent
        animationType="fade"
        onRequestClose={cerrarDetalle}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {tareaSeleccionada?.nombre}{' '}
              {tareaSeleccionada?.completadas}/
              {tareaSeleccionada?.total}
            </Text>

            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>
                Dosis
              </Text>

              <Text style={styles.modalValue}>
                {tareaSeleccionada?.dosis}
              </Text>
            </View>

            {tareaSeleccionada?.tomas?.map((toma) => (
              <View
                key={toma.hora}
                style={styles.modalRow}
              >
                <Text style={styles.modalLabel}>
                  {toma.hora} hs
                </Text>

                <Text
                  style={[
                    styles.modalValue,
                    toma.tomada && styles.modalValueTomada,
                  ]}
                >
                  {toma.tomada ? '✓ Tomada' : 'Pendiente'}
                </Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={cerrarDetalle}
            >
              <Text style={styles.modalCloseText}>
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={mostrarCalendario}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarCalendario(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => cambiarMes(-1)}>
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={textoMedio}
                />
              </TouchableOpacity>

              <Text style={styles.calendarMonthTitle}>
                {mesesNombres[mesVista.getMonth()]}{' '}
                {mesVista.getFullYear()}
              </Text>

              <TouchableOpacity onPress={() => cambiarMes(1)}>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={textoMedio}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarDaysHeader}>
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                <Text
                  key={d}
                  style={styles.calendarDayHeaderLabel}
                >
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {generarDiasMes().map((item, index) => {
                if (!item) {
                  return (
                    <View
                      key={`empty-${index}`}
                      style={styles.calendarCell}
                    />
                  );
                }

                const esHoy =
                  item.fechaCompleta === formatearFecha(new Date());

                const esSeleccionado =
                  item.fechaCompleta === diaSeleccionado;

                return (
                  <TouchableOpacity
                    key={item.fechaCompleta}
                    style={[
                      styles.calendarCell,
                      esHoy && styles.calendarCellHoy,
                      esSeleccionado &&
                        !esHoy &&
                        styles.calendarCellSelected,
                      esSeleccionado &&
                        esHoy &&
                        styles.calendarCellHoySelected,
                    ]}
                    onPress={() =>
                      seleccionarFechaCalendario(item.fechaCompleta)
                    }
                  >
                    <Text
                      style={[
                        styles.calendarCellText,
                        esHoy && styles.calendarCellTextHoy,
                        esSeleccionado &&
                          styles.calendarCellTextSelected,
                      ]}
                    >
                      {item.numero}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setMostrarCalendario(false)}
            >
              <Text style={styles.modalCloseText}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  peligroSuave,
}) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: fondo,
  },

  topContainer: {
    backgroundColor: tarjeta,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: borde,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  logo: {
    width: 42,
    height: 42,
    borderRadius: 6,
  },

  headerTitle: {
    color: texto,
    fontSize: 24,
    fontWeight: '600',
    flexShrink: 1,
  },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: fondoSecundario,
  },

  codeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: fondoSecundario,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: borde,
  },

  codeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },

  codeCardText: {
    color: texto,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },

  codeCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  codeCardButton: {
    padding: 4,
  },

  weekNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  navArrow: {
    width: 28,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  weekColumn: {
    flex: 1,
  },

  weekDayHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },

  weekDayHeaderItem: {
    flex: 1,
    alignItems: 'center',
  },

  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },

  dayLabel: {
    color: textoSuave,
    fontSize: 13,
  },

  dayLabelHoy: {
    color: primario,
    fontWeight: '700',
  },

  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: borde,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dayCircleHoy: {
    backgroundColor: primario,
    borderColor: primario,
  },

  dayCircleSelected: {
    borderColor: textoMedio,
    borderWidth: 2,
  },

  dayCircleHoySelected: {
    backgroundColor: primario,
    borderColor: primario,
    borderWidth: 2,
  },

  dayNumber: {
    color: textoMedio,
    fontSize: 14,
  },

  dayNumberHoy: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  dayNumberSelected: {
    color: texto,
    fontWeight: '700',
  },

  mainScrollView: {
    flex: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  sectionHeaderContent: {
    flex: 1,
    marginRight: 15,
  },

  sectionTitle: {
    color: texto,
    fontSize: 22,
    fontWeight: '700',
  },

  progresoFondo: {
    height: 6,
    width: '100%',
    backgroundColor: borde,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
  },

  progresoRelleno: {
    height: '100%',
    backgroundColor: primario,
    borderRadius: 10,
  },

  porcentajeTexto: {
    color: textoSuave,
    fontSize: 12,
    marginTop: 5,
  },

  tomasContainer: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },

  tomaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tarjeta,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: borde,
  },

  tomaBarTomada: {
    backgroundColor: primarioSuave,
    borderColor: primario,
  },

  tomaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  tomaInfoText: {
    flex: 1,
  },

  tomaNombre: {
    color: texto,
    fontSize: 15,
    fontWeight: '600',
  },

  tomaNombreTomada: {
    color: primario,
    textDecorationLine: 'line-through',
  },

  tomaDetalle: {
    color: textoSuave,
    fontSize: 13,
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },

  badgePendiente: {
    backgroundColor: fondoSecundario,
  },

  badgeTomada: {
    backgroundColor: primarioSuave,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: textoMedio,
  },

  badgeTextTomada: {
    color: primario,
  },

  emptyTomas: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: tarjeta,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: borde,
  },

  emptyTomasText: {
    color: textoSuave,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  loaderStyle: {
    marginVertical: 20,
  },

  quoteContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },

  addButton: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: primario,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    elevation: 4,
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
    borderTopColor: borde,
    backgroundColor: tarjeta,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },

  tabLabel: {
    fontSize: 12,
    color: textoSuave,
  },

  tabLabelActive: {
    color: primario,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: tarjeta,
    borderRadius: 18,
    padding: 20,
  },

  modalTitle: {
    color: texto,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
  },

  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: borde,
  },

  modalLabel: {
    color: textoSuave,
    fontSize: 14,
  },

  modalValue: {
    color: texto,
    fontSize: 14,
    fontWeight: '600',
  },

  modalValueTomada: {
    color: primario,
  },

  modalCloseButton: {
    marginTop: 18,
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  modalCloseText: {
    color: primario,
    fontWeight: '600',
    fontSize: 15,
  },

  calendarCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: tarjeta,
    borderRadius: 18,
    padding: 18,
  },

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  calendarMonthTitle: {
    color: texto,
    fontSize: 18,
    fontWeight: '700',
  },

  calendarDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },

  calendarDayHeaderLabel: {
    width: '14.28%',
    textAlign: 'center',
    color: textoSuave,
    fontSize: 12,
    fontWeight: '600',
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  calendarCell: {
    width: '14.28%',
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 21,
  },

  calendarCellHoy: {
    backgroundColor: primario,
  },

  calendarCellSelected: {
    borderWidth: 2,
    borderColor: textoMedio,
  },

  calendarCellHoySelected: {
    borderWidth: 2,
    borderColor: primario,
  },

  calendarCellText: {
    color: texto,
    fontSize: 14,
  },

  calendarCellTextHoy: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  calendarCellTextSelected: {
    fontWeight: '700',
  },
});