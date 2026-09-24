import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';

const PRIMARY = '#4caf50';
const STORAGE_KEY = '@medicamentos_terapia';

const TAB_BAR_ITEMS = [
  { key: 'hoy', label: 'Hoy', icon: 'list-outline', route: '/Home' },
  { key: 'progreso', label: 'Progreso', icon: 'stats-chart-outline', route: '/progreso' },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline', route: '/noticias' },
  { key: 'terapia', label: 'Terapia', icon: 'medkit-outline', route: '/terapia' },
];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatearFecha(fecha) {
  const date = new Date(fecha);
  if (!fecha || isNaN(date.getTime())) return 'Sin fecha';
  return `${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`;
}

// Fila reutilizable para no repetir el mismo bloque 4 veces
function InfoRow({ icon, label, value, last }) {
  return (
    <View style={[styles.infoRow, last && styles.lastInfoRow]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={PRIMARY} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function Terapia() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [medicamentos, setMedicamentos] = useState([]);

  const cargarMedicamentos = async () => {
    try {
      const datos = await AsyncStorage.getItem(STORAGE_KEY);
      const lista = datos ? JSON.parse(datos) : [];
      setMedicamentos(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.log('Error cargando medicamentos:', error);
      setMedicamentos([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarMedicamentos();
    }, [])
  );

  const eliminarMedicamento = async (index) => {
    try {
      const medicamento = medicamentos[index];

      // Cancelar todas las notificaciones programadas de este medicamento
      const ids = medicamento.notificationIds || [];
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }

      const nuevaLista = medicamentos.filter((_, i) => i !== index);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaLista));
      setMedicamentos(nuevaLista);
    } catch (error) {
      console.log('Error eliminando medicamento:', error);
      Alert.alert('Error', 'No se pudo eliminar el medicamento. Intentá de nuevo.');
    }
  };

  const confirmarEliminar = (medicamento, index) => {
    Alert.alert(
      'Eliminar medicamento',
      `¿Querés eliminar "${medicamento.nombre || 'este medicamento'}" de tu terapia?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminarMedicamento(index) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Terapia</Text>
        </View>

        {/* CONTENIDO */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 110 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Mis medicamentos</Text>
          <Text style={styles.subtitle}>
            Acá podés consultar los medicamentos que tenés registrados en tu terapia.
          </Text>

          {medicamentos.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="medkit-outline" size={30} color={PRIMARY} />
              </View>
              <Text style={styles.emptyTitle}>No tenés medicamentos registrados</Text>
              <Text style={styles.emptyText}>
                Agregá tu primer medicamento para verlo guardado en tu terapia.
              </Text>
            </View>
          ) : (
            medicamentos.map((med, index) => (
              <View key={med.id || `${med.nombre}-${index}`} style={styles.medicamentoCard}>
                {/* Nombre + botón eliminar */}
                <View style={styles.medicamentoHeader}>
                  <View style={styles.medicamentoIcon}>
                    <Text style={styles.iconText}>💊</Text>
                  </View>

                  <View style={styles.medicamentoHeaderText}>
                    <Text style={styles.medicamentoLabel}>Medicamento</Text>
                    <Text style={styles.medicamentoNombre}>{med.nombre || 'Sin nombre'}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteIconButton}
                    onPress={() => confirmarEliminar(med, index)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={20} color="#E53935" />
                  </TouchableOpacity>
                </View>

                <View style={styles.separador} />

                <InfoRow icon="repeat-outline" label="Cada cuánto se toma" value={med.frecuencia || 'No especificado'} />
                <InfoRow icon="time-outline" label="Hora" value={med.hora || 'No especificada'} />
                <InfoRow icon="medical-outline" label="Dosis" value={`${med.dosis || '1'} comprimido(s)`} />
                <InfoRow icon="flask-outline" label="Límite de dosis" value={`${med.limiteDosis || '30'} comprimido(s)`} />
                <InfoRow icon="calendar-outline" label="Fecha de inicio" value={formatearFecha(med.fechaInicio)} last />
              </View>
            ))
          )}
        </ScrollView>

        {/* BOTÓN AÑADIR */}
        <TouchableOpacity
          style={[styles.addButton, { bottom: 72 + insets.bottom }]}
          activeOpacity={0.85}
          onPress={() => router.push('/buscador')}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Añadir</Text>
        </TouchableOpacity>

        {/* TAB BAR */}
        <View style={[styles.tabBar, { paddingBottom: 12 + insets.bottom }]}>
          {TAB_BAR_ITEMS.map((item) => {
            const activo = item.key === 'terapia';
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.tabItem}
                onPress={() => router.replace(item.route)}
              >
                <Ionicons name={item.icon} size={22} color={activo ? PRIMARY : '#6C757D'} />
                <Text style={[styles.tabLabel, activo && styles.tabLabelActive]}>
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
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
  },
  headerTitle: { color: '#1A1D1E', fontSize: 26, fontWeight: '600' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { color: '#1A1D1E', fontSize: 22, fontWeight: '700' },
  subtitle: {
    color: '#6C757D',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 18,
  },

  // Tarjeta de medicamento
  medicamentoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    elevation: 2,
  },
  medicamentoHeader: { flexDirection: 'row', alignItems: 'center' },
  medicamentoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAF7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconText: { fontSize: 26 },
  medicamentoHeaderText: { flex: 1 },
  medicamentoLabel: { color: '#888888', fontSize: 13, marginBottom: 3 },
  medicamentoNombre: { color: '#1A1D1E', fontSize: 20, fontWeight: '700' },
  deleteIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDECEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  separador: { height: 1, backgroundColor: '#E5E8EB', marginVertical: 18 },

  // Filas de información
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  lastInfoRow: { marginBottom: 0 },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: { flex: 1 },
  infoLabel: { color: '#888888', fontSize: 13, marginBottom: 2 },
  infoValue: { color: '#1A1D1E', fontSize: 15, fontWeight: '600' },

  // Estado vacío
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
  emptyTitle: { color: '#1A1D1E', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyText: {
    color: '#6C757D',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },

  // Botón añadir
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
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  // Tab bar
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
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabLabel: { fontSize: 12, color: '#6C757D' },
  tabLabelActive: { color: PRIMARY, fontWeight: '600' },
});
