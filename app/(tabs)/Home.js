import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import QuoteCard from '../../components/Quotecard';
import { supabase } from '../../services/Supabase';


const obtenerVentanaDias = (fechaRefStr, diasAtras = 14, diasAdelante = 14) => {
  const [year, month, day] = fechaRefStr.split('-').map(Number);
  const nombresDias = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
  const dias = [];

  for (let i = -diasAtras; i <= diasAdelante; i++) {
    const fecha = new Date(year, month - 1, day + i);
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

const TAB_BAR_HEIGHT = 56;

const TAB_BAR_ITEMS = [
  { key: 'hoy', label: 'Hoy', icon: 'list-outline' },
  { key: 'progreso', label: 'Progreso', icon: 'stats-chart-outline' },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline' },
  { key: 'terapia', label: 'Terapia', icon: 'medkit-outline' },
];

export default function HoyScreen() {
  const insets = useSafeAreaInsets();
  const { width: widthPantalla } = useWindowDimensions();
  const scrollViewRef = useRef(null);

  const [diaSeleccionado, setDiaSeleccionado] = useState(HOY_STRING);
  const [diasVisibles, setDiasVisibles] = useState(obtenerVentanaDias(HOY_STRING, 14, 14));
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


  const centrarDia = (index, animado = false) => {
    if (index < 0 || !scrollViewRef.current) return;

    const ANCHO_ITEM = 46;
    const GAP = 12;
    const PADDING = 16;

    const centroItem = PADDING + index * (ANCHO_ITEM + GAP) + ANCHO_ITEM / 2;
    const targetX = centroItem - widthPantalla / 2;

    scrollViewRef.current.scrollTo({
      x: Math.max(0, targetX),
      animated: animado,
    });
  };

  useEffect(() => {
    const index = diasVisibles.findIndex((d) => d.fechaCompleta === diaSeleccionado);
    if (index !== -1) {
      const timer = setTimeout(() => {
        centrarDia(index, false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [diaSeleccionado, diasVisibles, widthPantalla]);

  useEffect(() => {
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
    setDiasVisibles(obtenerVentanaDias(fechaStr, 14, 14));
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

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      
      <View style={styles.topContainer}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{obtenerTituloFecha(diaSeleccionado)}</Text>
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

        
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekRow}
        >
          {diasVisibles.map((dia, index) => {
            const esHoy = dia.fechaCompleta === HOY_STRING;
            const esSeleccionado = dia.fechaCompleta === diaSeleccionado;

            return (
              <TouchableOpacity
                key={dia.fechaCompleta}
                style={styles.dayColumn}
                onPress={() => {
                  setDiaSeleccionado(dia.fechaCompleta);
                  centrarDia(index, true);
                }}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    esHoy && styles.dayLabelHoy,
                    esSeleccionado && styles.dayLabelSelected,
                  ]}
                >
                  {dia.label}
                </Text>

                <View
                  style={[
                    styles.dayCircle,
                    esHoy && styles.dayCircleHoy,
                    esSeleccionado && styles.dayCircleSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      esHoy && styles.dayNumberHoy,
                      esSeleccionado && styles.dayNumberSelected,
                    ]}
                  >
                    {dia.numero}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
              onPress={() => setTabActiva(item.key)}
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
                      esSeleccionado && styles.calendarCellSelected,
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
  headerTitle: {
    color: '#1A1D1E',
    fontSize: 26,
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
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  dayColumn: {
    width: 46,
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    color: '#6C757D',
    fontSize: 13,
  },
  dayLabelHoy: {
    color: '#4caf50',
    fontWeight: '700',
  },
  dayLabelSelected: {
    color: '#1A1D1E',
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
    borderColor: '#1A1D1E',
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
  taskList: {
    maxHeight: 160,
    paddingHorizontal: 20,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
  },
  taskItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  taskItemText: {
    color: '#1A1D1E',
    fontSize: 15,
    flexShrink: 1,
  },
  taskItemHora: {
    color: '#6C757D',
    fontSize: 14,
    fontWeight: '500',
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
    borderColor: '#1A1D1E',
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