import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QuoteCard from '../../components/Quotecard';

// Datos de ejemplo.

const DIAS_SEMANA = [
  { label: 'Jue.', numero: 17 },
  { label: 'Vie.', numero: 18 },
  { label: 'Sáb.', numero: 19 },
  { label: 'Dom.', numero: 20 },
  { label: 'Lun.', numero: 21 },
  { label: 'Mar.', numero: 22 },
  { label: 'Mié.', numero: 23 },
];

const TAREAS_RESUELTAS = [
  {
    id: '1',
    nombre: 'Ibuprofeno 400mg',
    hora: '08:00',
    dosis: '1 comprimido',
    estado: 'Tomado',
  },
  {
    id: '2',
    nombre: 'Vitamina D',
    hora: '09:30',
    dosis: '2 gotas',
    estado: 'Tomado',
  },
];

// Alto aproximado de la tab bar (íconos + label + padding vertical base),
// sin contar el inset del propio teléfono. Se usa para ubicar "Añadir".
const TAB_BAR_HEIGHT = 56;

const TAB_BAR_ITEMS = [
  { key: 'hoy', label: 'Hoy', icon: 'list-outline' },
  { key: 'progreso', label: 'Progreso', icon: 'stats-chart-outline' },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline' },
  { key: 'terapia', label: 'Terapia', icon: 'medkit-outline' },
];

export default function HoyScreen() {
  const insets = useSafeAreaInsets();
  const [diaSeleccionado, setDiaSeleccionado] = useState(20);
  const [seccionAbierta, setSeccionAbierta] = useState(true);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [tabActiva, setTabActiva] = useState('hoy');

  const abrirDetalle = (tarea) => setTareaSeleccionada(tarea);
  const cerrarDetalle = () => setTareaSeleccionada(null);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hoy</Text>

        <View style={styles.headerIcons}>
          {/* Espacio reservado para el calendario. Sin acción por ahora. */}
          <View style={styles.iconButton}>
            <Ionicons name="calendar-outline" size={22} color="#EDEDED" />
          </View>

          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakNumber}>12</Text>
          </View>

          <View style={styles.iconButton}>
            <Ionicons name="mail-outline" size={22} color="#EDEDED" />
            <View style={styles.badgeDot} />
          </View>
        </View>
      </View>

      {/* Selector de días */}
      <View style={styles.weekRow}>
        {DIAS_SEMANA.map((dia) => {
          const seleccionado = dia.numero === diaSeleccionado;
          return (
            <TouchableOpacity
              key={dia.numero}
              style={styles.dayColumn}
              onPress={() => setDiaSeleccionado(dia.numero)}
            >
              <Text
                style={[
                  styles.dayLabel,
                  seleccionado && styles.dayLabelSelected,
                ]}
              >
                {dia.label}
              </Text>
              <View
                style={[
                  styles.dayCircle,
                  seleccionado && styles.dayCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    seleccionado && styles.dayNumberSelected,
                  ]}
                >
                  {dia.numero}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.divider} />

      {/* Tareas pendientes / resueltas */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setSeccionAbierta((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>Tareas resueltas/ (pendientes si no estan resueltas)</Text>
        <Ionicons
          name={seccionAbierta ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#EDEDED"
        />
      </TouchableOpacity>

      {seccionAbierta && (
        <ScrollView style={styles.taskList}>
          {TAREAS_RESUELTAS.map((tarea) => (
            <TouchableOpacity
              key={tarea.id}
              style={styles.taskItem}
              onPress={() => abrirDetalle(tarea)}
              activeOpacity={0.7}
            >
              <View style={styles.taskItemLeft}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#4caf50"
                />
                <Text style={styles.taskItemText}>{tarea.nombre}</Text>
              </View>
              <Text style={styles.taskItemHora}>{tarea.hora}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Zona central: la estrella se omite por ahora; va la frase del día */}
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
        <Ionicons name="add-circle-outline" size={22} color="#0E1416" />
        <Text style={styles.addButtonText}>Añadir</Text>
      </TouchableOpacity>

      {/* Barra inferior */}
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
                color={activo ? '#4caf50' : '#9AA0A6'}
              />
              <Text
                style={[styles.tabLabel, activo && styles.tabLabelActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modal con el detalle del medicamento */}
      <Modal
        visible={!!tareaSeleccionada}
        transparent
        animationType="fade"
        onRequestClose={cerrarDetalle}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {tareaSeleccionada?.nombre}
            </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0E1416',
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
    color: '#F5F5F5',
    fontSize: 28,
    fontWeight: '600',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5484D',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3F42',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakNumber: {
    color: '#F5F5F5',
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    color: '#8A9094',
    fontSize: 13,
  },
  dayLabelSelected: {
    color: '#F5F5F5',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3A3F42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSelected: {
    borderColor: '#F5F5F5',
    borderWidth: 2,
  },
  dayNumber: {
    color: '#C8CCCE',
    fontSize: 14,
  },
  dayNumberSelected: {
    color: '#F5F5F5',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2F31',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    color: '#F5F5F5',
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2426',
  },
  taskItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskItemText: {
    color: '#EDEDED',
    fontSize: 15,
  },
  taskItemHora: {
    color: '#8A9094',
    fontSize: 13,
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
    color: '#0E1416',
    fontWeight: '700',
    fontSize: 15,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2F31',
    backgroundColor: '#15191B',
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#9AA0A6',
  },
  tabLabelActive: {
    color: '#4caf50',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#1B2022',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    color: '#F5F5F5',
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
    color: '#8A9094',
    fontSize: 14,
  },
  modalValue: {
    color: '#EDEDED',
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
});