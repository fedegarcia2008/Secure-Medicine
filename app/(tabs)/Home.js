import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import QuoteCard from '../../components/Quotecard';
import { supabase } from '../../services/Supabase';
import { useRouter } from 'expo-router';

// Asegúrate de ajustar el nombre del archivo y extensión según tu imagen en assets
const logoApp = require('../../assets/images/Secure Medicine.png');

// Devuelve los 7 días (Lunes a Domingo) de la semana que contiene fechaRefStr.
const obtenerSemana = (fechaRefStr) => {
  const [year, month, day] = fechaRefStr.split('-').map(Number);
  const fechaRef = new Date(year, month - 1, day);
  const diaSemana = fechaRef.getDay();
  const offsetLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const nombresDias = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
  const dias = [];

  for (let i = 0; i < 7; i++) {
    const fecha = new Date(year, month - 1, day + offsetLunes + i);
    const yStr = fecha.getFullYear();
    const mStr = String(fecha.getMonth() + 1).padStart(2, '0');
    const dStr = String(fecha.getDate()).padStart(2, '0');

    dias.push({
      label: nombresDias[fecha.getDay()],
      numero: fecha.getDate(),
      fechaCompleta: `${yStr}-${mStr}-${dStr}`,
    });
  }
  return dias;
};

const fechaHoyObj = new Date();
const HOY_STRING = `${fechaHoyObj.getFullYear()}-${String(fechaHoyObj.getMonth() + 1).padStart(2, '0')}-${String(fechaHoyObj.getDate()).padStart(2, '0')}`;

const obtenerTituloFecha = (fechaStr) => {
  if (fechaStr === HOY_STRING) return 'Hoy';

  const [year, month, day] = fechaStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);

  const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const mesesNombresCortos = ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'];

  const nombreDia = nombresDias[fecha.getDay()];
  const nombreMes = mesesNombresCortos[fecha.getMonth()];

  return `${nombreDia}, ${day} ${nombreMes}`;
};

const desplazarFecha = (fechaStr, dias) => {
  const [year, month, day] = fechaStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day + dias);
  const yStr = fecha.getFullYear();
  const mStr = String(fecha.getMonth() + 1).padStart(2, '0');
  const dStr = String(fecha.getDate()).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
};

const TAB_BAR_HEIGHT = 56;

// Rutas configuradas según Expo Router
const TAB_BAR_ITEMS = [
  { key: 'hoy', label: 'Hoy', icon: 'list-outline', route: '/Home' },
  { key: 'progreso', label: 'Progreso', icon: 'stats-chart-outline', route: '/progreso' },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline', route: '/noticias' },
  { key: 'terapia', label: 'Terapia', icon: 'medkit-outline', route: '/terapia' },
];

export default function HoyScreen() {
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

  const abrirDetalle = (tarea) => setTareaSeleccionada(tarea);
  const cerrarDetalle = () => setTareaSeleccionada(null);

  const cambiarSemana = (incrementoSemanas) => {
    const primerDiaActual = diasVisibles[0].fechaCompleta;
    const nuevaFechaRef = desplazarFecha(primerDiaActual, incrementoSemanas * 7);
    setDiasVisibles(obtenerSemana(nuevaFechaRef));
  };

  const seleccionarDia = (fechaCompleta) => {
    setDiaSeleccionado(fechaCompleta);
  };

  React.useEffect(() => {
    const traerCodigo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('perfiles')
        .select('codigo')
        .eq('id', user.id)
        .single();

      if (!error && data?.codigo) {
        setCodigo(data.codigo);
      }
    };

    traerCodigo();
  }, []);

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

  const generarDiasMes = () => {
    const year = mesVista.getFullYear();
    const month = mesVista.getMonth();
    const primerDiaMes = new Date(year, month, 1).getDay();
    const totalDias = new Date(year, month + 1, 0).getDate();

    const desplazamiento = primerDiaMes === 0 ? 6 : primerDiaMes - 1;
    const dias = [];

    for (let i = 0; i < desplazamiento; i++) {
      dias.push(null);
    }

    for (let i = 1; i <= totalDias; i++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      dias.push({
        numero: i,
        fechaCompleta: `${year}-${mStr}-${dStr}`,
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
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.topContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={logoApp} style={styles.logo} resizeMode="contain" />
            <Text style={styles.headerTitle}>{obtenerTituloFecha(diaSeleccionado)}</Text>
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setMostrarCalendario(true)}
          >
            <Ionicons name="calendar-outline" size={24} color="#1A1D1E" />
          </TouchableOpacity>
        </View>

        {mostrarCodigo && codigo && (
          <View style={styles.codeCard}>
            <View style={styles.codeCardLeft}>
              <Ionicons name="key-outline" size={18} color="#4caf50" />
              <Text style={styles.codeCardText}>Tu código: {codigo}</Text>
            </View>

            <View style={styles.codeCardActions}>
              <TouchableOpacity onPress={copiarCodigo} style={styles.codeCardButton}>
                <Ionicons
                  name={copiado ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={copiado ? '#4caf50' : '#1A1D1E'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMostrarCodigo(false)}
                style={styles.codeCardButton}
              >
                <Ionicons name="close" size={18} color="#6C757D" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.weekNavContainer}>
          <TouchableOpacity
            onPress={() => cambiarSemana(-1)}
            style={styles.navArrow}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color="#6C757D" />
          </TouchableOpacity>

          <View style={styles.weekColumn}>
            <View style={styles.weekDayHeaderRow} pointerEvents="none">
              {diasVisibles.map((dia) => {
                const esHoy = dia.fechaCompleta === HOY_STRING;
                return (
                  <View key={dia.fechaCompleta} style={styles.weekDayHeaderItem}>
                    <Text style={[styles.dayLabel, esHoy && styles.dayLabelHoy]}>
                      {dia.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.weekRow}>
              {diasVisibles.map((dia) => {
                const esHoy = dia.fechaCompleta === HOY_STRING;
                const esSeleccionado = dia.fechaCompleta === diaSeleccionado;

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
                        esSeleccionado && !esHoy && styles.dayCircleSelected,
                        esSeleccionado && esHoy && styles.dayCircleHoySelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          esHoy && styles.dayNumberHoy,
                          esSeleccionado && !esHoy && styles.dayNumberSelected,
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
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-forward" size={20} color="#6C757D" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setSeccionAbierta((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>
          Tareas resueltas/ (pendientes si no estan resueltas)
        </Text>
        <Ionicons
          name={seccionAbierta ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#1A1D1E"
        />
      </TouchableOpacity>

      <View style={styles.emptySpace}>
        <QuoteCard />
      </View>

      <TouchableOpacity
        style={[
          styles.addButton,
          { bottom: TAB_BAR_HEIGHT + insets.bottom + 16 },
        ]}
        activeOpacity={0.85}
        onPress={() => router.push('/buscador')}
      >
        <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Añadir</Text>
      </TouchableOpacity>

      <View style={[styles.tabBar, { paddingBottom: 12 + insets.bottom }]}>
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
                color={activo ? '#4caf50' : '#6C757D'}
              />
              <Text style={[styles.tabLabel, activo && styles.tabLabelActive]}>
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
            <Text style={styles.modalTitle}>{tareaSeleccionada?.nombre}</Text>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Hora</Text>
              <Text style={styles.modalValue}>{tareaSeleccionada?.hora}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Dosis</Text>
              <Text style={styles.modalValue}>{tareaSeleccionada?.dosis}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Estado</Text>
              <Text style={styles.modalValue}>{tareaSeleccionada?.estado}</Text>
            </View>

            <TouchableOpacity style={styles.modalCloseButton} onPress={cerrarDetalle}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
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
                <Ionicons name="chevron-back" size={24} color="#1A1D1E" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>
                {mesesNombres[mesVista.getMonth()]} {mesVista.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => cambiarMes(1)}>
                <Ionicons name="chevron-forward" size={24} color="#1A1D1E" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarDaysHeader}>
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                <Text key={d} style={styles.calendarDayHeaderLabel}>{d}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {generarDiasMes().map((item, index) => {
                if (!item) return <View key={`empty-${index}`} style={styles.calendarCell} />;
                const esHoy = item.fechaCompleta === HOY_STRING;
                const esSeleccionado = item.fechaCompleta === diaSeleccionado;

                return (
                  <TouchableOpacity
                    key={item.fechaCompleta}
                    style={[
                      styles.calendarCell,
                      esHoy && styles.calendarCellHoy,
                      esSeleccionado && !esHoy && styles.calendarCellSelected,
                      esSeleccionado && esHoy && styles.calendarCellHoySelected,
                    ]}
                    onPress={() => seleccionarFechaCalendario(item.fechaCompleta)}
                  >
                    <Text
                      style={[
                        styles.calendarCellText,
                        esHoy && styles.calendarCellTextHoy,
                        esSeleccionado && styles.calendarCellTextSelected,
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
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  topContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
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
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 6,
  },
  headerTitle: {
    color: '#1A1D1E',
    fontSize: 24,
    fontWeight: '600',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F0F3F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E8',
  },
  codeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeCardText: {
    color: '#1A1D1E',
    fontSize: 14,
    fontWeight: '600',
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
    color: '#6C757D',
    fontSize: 13,
  },
  dayLabelHoy: {
    color: '#4caf50',
    fontWeight: '700',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleHoy: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  dayCircleSelected: {
    borderColor: '#4A5056',
    borderWidth: 2,
  },
  dayCircleHoySelected: {
    backgroundColor: '#4caf50',
    borderColor: '#2E7D32',
    borderWidth: 2,
  },
  dayNumber: {
    color: '#4A5056',
    fontSize: 14,
  },
  dayNumberHoy: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: '#1A1D1E',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    color: '#1A1D1E',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySpace: {
    flex: 1,
    justifyContent: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4caf50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
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
    color: '#4caf50',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    color: '#1A1D1E',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  modalLabel: {
    color: '#6C757D',
    fontSize: 14,
  },
  modalValue: {
    color: '#1A1D1E',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 18,
    alignSelf: 'flex-end',
  },
  modalCloseText: {
    color: '#4caf50',
    fontWeight: '600',
    fontSize: 15,
  },
  calendarCard: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonthTitle: {
    color: '#1A1D1E',
    fontSize: 17,
    fontWeight: '700',
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarDayHeaderLabel: {
    width: 36,
    textAlign: 'center',
    color: '#6C757D',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 20,
  },
  calendarCellHoy: {
    backgroundColor: '#4caf50',
  },
  calendarCellSelected: {
    borderWidth: 2,
    borderColor: '#4A5056',
  },
  calendarCellHoySelected: {
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  calendarCellText: {
    color: '#1A1D1E',
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