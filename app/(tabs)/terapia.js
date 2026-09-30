
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../services/Supabase';

const PRIMARY = '#4caf50';

const TAB_BAR_ITEMS = [
  { key: 'hoy', label: 'Home', icon: 'list-outline', route: '/Home' },
  { key: 'progreso', label: 'Progreso', icon: 'stats-chart-outline', route: '/progreso' },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline', route: '/noticias' },
  { key: 'terapia', label: 'Terapia', icon: 'medkit-outline', route: '/terapia' },
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

  if (isNaN(date.getTime())) return 'Sin fecha';

  return `${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`;
}

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
  const [cargando, setCargando] = useState(true);

  const [cuentasEnlazadas, setCuentasEnlazadas] = useState([]);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('mía');

  const [modalEnlazarVisible, setModalEnlazarVisible] = useState(false);
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [procesandoEnlace, setProcesandoEnlace] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: enlazadasData, error: enlaceErr } = await supabase
        .from('cuentas_enlazadas')
        .select(`
          observado_id,
          perfiles:observado_id (
            id,
            apodo,
            codigo
          )
        `)
        .eq('observador_id', user.id);

      if (!enlaceErr && enlazadasData) {
        const perfilesObservados = enlazadasData
          .map((e) => e.perfiles)
          .filter(Boolean);

        setCuentasEnlazadas(perfilesObservados);
      }

      const idAConsultar =
        cuentaSeleccionada === 'mía' ? user.id : cuentaSeleccionada;

      const { data: medsData, error: medsErr } = await supabase
        .from('medicamentos')
        .select('*')
        .eq('perfil_id', idAConsultar)
        .eq('en_tratamiento', true)
        .order('creado_en', { ascending: false });

      if (medsErr) {
        console.log('Error cargando medicamentos:', medsErr.message);
      } else {
        setMedicamentos(medsData || []);
      }
    } catch (error) {
      console.log('Error en cargarDatos:', error);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cuentaSeleccionada])
  );

  const eliminarMedicamento = async (idMedicamento, nombreMed) => {
    try {
      const { error } = await supabase
        .from('medicamentos')
        .delete()
        .eq('id', idMedicamento);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Eliminado',
          `"${nombreMed}" se eliminó de la terapia.`
        );

        cargarDatos();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el medicamento.');
    }
  };

  const confirmarEliminar = (med) => {
    Alert.alert(
      'Eliminar medicamento',
      `¿Querés eliminar "${med.nombre || 'este medicamento'}" de tu terapia?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => eliminarMedicamento(med.id, med.nombre),
        },
      ]
    );
  };

  const eliminarCuentaEnlazada = (cuenta) => {
    Alert.alert(
      'Desvincular cuenta',
      `¿Querés dejar de supervisar a ${
        cuenta.apodo || 'esta cuenta'
      }?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) return;

              const { error } = await supabase
                .from('cuentas_enlazadas')
                .delete()
                .eq('observador_id', user.id)
                .eq('observado_id', cuenta.id);

              if (error) {
                Alert.alert(
                  'Error',
                  'No se pudo desvincular la cuenta.'
                );
                return;
              }

              setCuentasEnlazadas((cuentasActuales) =>
                cuentasActuales.filter((item) => item.id !== cuenta.id)
              );

              if (cuentaSeleccionada === cuenta.id) {
                setCuentaSeleccionada('mía');
              }

              Alert.alert(
                'Cuenta desvinculada',
                'La cuenta se eliminó correctamente.'
              );
            } catch (error) {
              Alert.alert(
                'Error',
                'Ocurrió un problema al desvincular la cuenta.'
              );
            }
          },
        },
      ]
    );
  };

  const handleEnlazarCuenta = async () => {
    if (!codigoIngresado.trim()) {
      Alert.alert('Error', 'Ingresá un código válido.');
      return;
    }

    setProcesandoEnlace(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: perfilEncontrado, error: perfilErr } = await supabase
        .from('perfiles')
        .select('id, apodo')
        .eq('codigo', codigoIngresado.trim().toUpperCase())
        .single();

      if (perfilErr || !perfilEncontrado) {
        Alert.alert(
          'Código no encontrado',
          'Verificá el código e intentá nuevamente.'
        );

        setProcesandoEnlace(false);
        return;
      }

      if (perfilEncontrado.id === user.id) {
        Alert.alert(
          'Atención',
          'No podés vincular tu propio código.'
        );

        setProcesandoEnlace(false);
        return;
      }

      const { error: insertErr } = await supabase
        .from('cuentas_enlazadas')
        .insert({
          observador_id: user.id,
          observado_id: perfilEncontrado.id,
        });

      setProcesandoEnlace(false);

      if (insertErr) {
        if (insertErr.code === '23505') {
          Alert.alert(
            'Aviso',
            'Ya tenés enlazada esta cuenta.'
          );
        } else {
          Alert.alert('Error', insertErr.message);
        }
      } else {
        Alert.alert(
          '¡Cuenta enlazada!',
          `Ahora podés supervisar la terapia de ${perfilEncontrado.apodo}.`
        );

        setModalEnlazarVisible(false);
        setCodigoIngresado('');
        cargarDatos();
      }
    } catch (error) {
      setProcesandoEnlace(false);
      Alert.alert('Error', 'No se pudo realizar el enlace.');
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Terapia</Text>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setModalEnlazarVisible(true)}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={PRIMARY}
            />

            <Text style={styles.linkButtonText}>
              Enlazar cuenta
            </Text>
          </TouchableOpacity>
        </View>

        {cuentasEnlazadas.length > 0 && (
          <View style={styles.selectorContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectorScroll}
            >
              <TouchableOpacity
                style={[
                  styles.chip,
                  cuentaSeleccionada === 'mía' && styles.chipActive,
                ]}
                onPress={() => setCuentaSeleccionada('mía')}
              >
                <Text
                  style={[
                    styles.chipText,
                    cuentaSeleccionada === 'mía' &&
                      styles.chipTextActive,
                  ]}
                >
                  Mi Terapia
                </Text>
              </TouchableOpacity>

              {cuentasEnlazadas.map((cuenta) => (
                <View
                  key={cuenta.id}
                  style={[
                    styles.chip,
                    cuentaSeleccionada === cuenta.id &&
                      styles.chipActive,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.chipAccountButton}
                    onPress={() =>
                      setCuentaSeleccionada(cuenta.id)
                    }
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="eye-outline"
                      size={14}
                      color={
                        cuentaSeleccionada === cuenta.id
                          ? '#FFFFFF'
                          : '#4A5359'
                      }
                    />

                    <Text
                      style={[
                        styles.chipText,
                        cuentaSeleccionada === cuenta.id &&
                          styles.chipTextActive,
                      ]}
                    >
                      {cuenta.apodo}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeLinkedButton}
                    onPress={() =>
                      eliminarCuentaEnlazada(cuenta)
                    }
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="close"
                      size={15}
                      color={
                        cuentaSeleccionada === cuenta.id
                          ? '#FFFFFF'
                          : '#6C757D'
                      }
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 110 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>
            {cuentaSeleccionada === 'mía'
              ? 'Mis medicamentos'
              : 'Medicamentos en seguimiento'}
          </Text>

          <Text style={styles.subtitle}>
            {cuentaSeleccionada === 'mía'
              ? 'Acá podés consultar los medicamentos que tenés registrados en tu terapia.'
              : 'Estás consultando la terapia de tu familiar o cuenta enlazada.'}
          </Text>

          {cargando ? (
            <ActivityIndicator
              size="large"
              color={PRIMARY}
              style={{ marginTop: 40 }}
            />
          ) : medicamentos.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="medkit-outline"
                  size={30}
                  color={PRIMARY}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No hay medicamentos registrados
              </Text>

              <Text style={styles.emptyText}>
                {cuentaSeleccionada === 'mía'
                  ? 'Agregá tu primer medicamento para verlo guardado en tu terapia.'
                  : 'Esta persona aún no registró medicamentos.'}
              </Text>
            </View>
          ) : (
            medicamentos.map((med) => (
              <View
                key={med.id}
                style={styles.medicamentoCard}
              >
                <View style={styles.medicamentoHeader}>
                  <View style={styles.medicamentoIcon}>
                    <Text style={styles.iconText}>💊</Text>
                  </View>

                  <View style={styles.medicamentoHeaderText}>
                    <Text style={styles.medicamentoLabel}>
                      Medicamento
                    </Text>

                    <Text style={styles.medicamentoNombre}>
                      {med.nombre || 'Sin nombre'}
                    </Text>
                  </View>

                  {cuentaSeleccionada === 'mía' && (
                    <TouchableOpacity
                      style={styles.deleteIconButton}
                      onPress={() => confirmarEliminar(med)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#E53935"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.separador} />

                <InfoRow
                  icon="repeat-outline"
                  label="Cada cuánto se toma"
                  value={med.frecuencia || 'No especificado'}
                />

                <InfoRow
                  icon="time-outline"
                  label="Hora"
                  value={med.hora || 'No especificada'}
                />

                <InfoRow
                  icon="medical-outline"
                  label="Dosis"
                  value={`${med.dosis || '1'} comprimido(s)`}
                />

                <InfoRow
                  icon="flask-outline"
                  label="Límite de dosis"
                  value={`${med.limite_dosis || '30'} comprimido(s)`}
                />

                <InfoRow
                  icon="calendar-outline"
                  label="Fecha de inicio"
                  value={formatearFecha(med.fecha_inicio)}
                  last
                />
              </View>
            ))
          )}
        </ScrollView>

        {cuentaSeleccionada === 'mía' && (
          <TouchableOpacity
            style={[
              styles.addButton,
              { bottom: 72 + insets.bottom },
            ]}
            activeOpacity={0.85}
            onPress={() => router.push('/buscador')}
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.addButtonText}>Añadir</Text>
          </TouchableOpacity>
        )}

        <View
          style={[
            styles.tabBar,
            { paddingBottom: 12 + insets.bottom },
          ]}
        >
          {TAB_BAR_ITEMS.map((item) => {
            const activo = item.key === 'terapia';

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

        <Modal
          visible={modalEnlazarVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalEnlazarVisible(false)}
        >
          <View style={styles.overlayModal}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                Enlazar Cuenta
              </Text>

              <Text style={styles.modalSubtext}>
                Ingresá el código de la persona que querés supervisar:
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Ej: ABC1234"
                placeholderTextColor="#999"
                autoCapitalize="characters"
                value={codigoIngresado}
                onChangeText={setCodigoIngresado}
              />

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.btnCancel}
                  onPress={() => {
                    setModalEnlazarVisible(false);
                    setCodigoIngresado('');
                  }}
                >
                  <Text style={styles.btnCancelText}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnConfirm}
                  onPress={handleEnlazarCuenta}
                  disabled={procesandoEnlace}
                >
                  {procesandoEnlace ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                      size="small"
                    />
                  ) : (
                    <Text style={styles.btnConfirmText}>
                      Enlazar
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#1A1D1E',
    fontSize: 26,
    fontWeight: '600',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  linkButtonText: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 13,
  },
  selectorContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
  },
  selectorScroll: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#F1F3F5',
  },
  chipActive: {
    backgroundColor: PRIMARY,
  },
  chipAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeLinkedButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  chipText: {
    color: '#4A5359',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
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
  deleteIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDECEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  overlayModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D1E',
    marginBottom: 6,
  },
  modalSubtext: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F5F6F8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btnCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnCancelText: {
    color: '#6C757D',
    fontWeight: '600',
  },
  btnConfirm: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnConfirmText: {
    color: '#FFF',
    fontWeight: '700',
  },
});
