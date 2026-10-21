import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
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
import Text from '../../components/Texto';
import TabBar, { TAB_BAR_HEIGHT } from '../../components/TabBar';
import { useColores, useEstilos } from '../../context/ColorContext';
// AJUSTÁ esta ruta si tu notificaciones.js está en otra carpeta
import {
  FRECUENCIA_A_HORAS,
  calcularHorariosDelDia,
  configurarNotificaciones,
  registrarPushToken,
} from '../../services/Notificaciones';

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

// ---------- Helpers de tomas ----------

const pad = (n) => String(n).padStart(2, '0');

function fechaHoy() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function horaAhora() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ¿El tratamiento ya empezó? (si no hay fecha, se considera que sí)
function yaInicio(med) {
  if (!med.fecha_inicio) return true;
  const inicio = new Date(med.fecha_inicio);
  if (isNaN(inicio.getTime())) return true;
  return inicio <= new Date();
}

// Devuelve los horarios del día de un medicamento, ej: ['00:00', '08:00', '16:00']
function horariosDeMed(med) {
  if (!med.hora || !med.hora.includes(':')) return [];

  const [hh, mm] = med.hora.split(':').map(Number);
  const intervalo = med.frecuencia_horas || FRECUENCIA_A_HORAS[med.frecuencia];

  const lista = intervalo
    ? calcularHorariosDelDia(med.hora, intervalo)
    : [{ hour: hh, minute: mm }];

  return lista
    .map(({ hour, minute }) => `${pad(hour)}:${pad(minute)}`)
    .sort();
}

function InfoRow({ icon, label, value, last }) {
  const { primario } = useColores();
  const styles = useEstilos(crearEstilos);
  return (
    <View style={[styles.infoRow, last && styles.lastInfoRow]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={primario} />
      </View>

      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function Terapia() {
  const { primario, textoMedio, textoSuave } = useColores();
  const styles = useEstilos(crearEstilos);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [medicamentos, setMedicamentos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [cuentasEnlazadas, setCuentasEnlazadas] = useState([]);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('mía');

  const [modalEnlazarVisible, setModalEnlazarVisible] = useState(false);
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [procesandoEnlace, setProcesandoEnlace] = useState(false);

  // NUEVO: tomas de hoy y estado del botón Avisar
  const [tomasHoy, setTomasHoy] = useState([]);
  const [avisando, setAvisando] = useState(false);

  // NUEVO: al abrir la pantalla, pide permiso y guarda el token de este celular
  useEffect(() => {
    const registrar = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const ok = await configurarNotificaciones();
        if (ok) await registrarPushToken(user.id);
      } catch (error) {
        console.log('Error registrando notificaciones:', error);
      }
    };

    registrar();
  }, []);

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

      // NUEVO: tomas registradas hoy
      const { data: tomasData, error: tomasErr } = await supabase
        .from('tomas')
        .select('id, medicamento_id, hora')
        .eq('perfil_id', idAConsultar)
        .eq('fecha', fechaHoy());

      if (tomasErr) {
        console.log('Error cargando tomas:', tomasErr.message);
        setTomasHoy([]);
      } else {
        setTomasHoy(tomasData || []);
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

  // ---------- NUEVO: lógica de tomas ----------

  // 'tomada' | 'pendiente' (la hora ya pasó y no se marcó) | 'proxima'
  const estadoToma = (med, hora) => {
    const tomada = tomasHoy.find(
      (t) => t.medicamento_id === med.id && t.hora === hora
    );

    if (tomada) return 'tomada';
    if (!yaInicio(med)) return 'proxima';

    return hora <= horaAhora() ? 'pendiente' : 'proxima';
  };

  // Todas las tomas atrasadas sin registrar
  const pendientes = medicamentos.flatMap((m) =>
    horariosDeMed(m)
      .filter((h) => estadoToma(m, h) === 'pendiente')
      .map((h) => ({ med: m, hora: h }))
  );

  // Marca / desmarca una toma (solo en la cuenta propia)
  const alternarToma = async (med, hora) => {
    try {
      const existente = tomasHoy.find(
        (t) => t.medicamento_id === med.id && t.hora === hora
      );

      if (existente) {
        const { error } = await supabase
          .from('tomas')
          .delete()
          .eq('id', existente.id);

        if (error) {
          Alert.alert('Error', 'No se pudo desmarcar la toma.');
          return;
        }

        setTomasHoy((prev) => prev.filter((t) => t.id !== existente.id));
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('tomas')
        .insert({
          medicamento_id: med.id,
          perfil_id: user.id,
          fecha: fechaHoy(),
          hora,
        })
        .select('id, medicamento_id, hora')
        .single();

      if (error) {
        Alert.alert('Error', 'No se pudo registrar la toma.');
        return;
      }

      setTomasHoy((prev) => [...prev, data]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la toma.');
    }
  };

  // Manda la notificación a la persona supervisada
  const avisarPersona = async () => {
    setAvisando(true);

    try {
      const { data, error } = await supabase.functions.invoke('avisar-toma', {
        body: {
          observado_id: cuentaSeleccionada,
          pendientes: pendientes.map((p) => `${p.med.nombre} (${p.hora})`),
        },
      });

      if (error) {
        Alert.alert('Error', 'No se pudo enviar el aviso.');
      } else if (data?.error === 'sin_token') {
        Alert.alert(
          'No se pudo avisar',
          'La otra persona todavía no activó las notificaciones en su celular. Pedile que abra la app y acepte los permisos.'
        );
      } else if (data?.error) {
        Alert.alert('Error', 'No se pudo enviar el aviso.');
      } else {
        Alert.alert(
          'Aviso enviado',
          'Le llegó una notificación para que tome sus medicamentos.'
        );
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo enviar el aviso.');
    } finally {
      setAvisando(false);
    }
  };

  // ---------- Fin lógica de tomas ----------

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

      const { data: resultado, error: perfilErr } = await supabase.rpc(
        'buscar_perfil_por_codigo',
        { p_codigo: codigoIngresado }
      );

      const perfilEncontrado = resultado?.[0];

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

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setModalEnlazarVisible(true)}
            >
              <Ionicons
                name="people-outline"
                size={20}
                color={primario}
              />

              <Text style={styles.linkButtonText}>
                Enlazar cuenta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/configuracion/ajustes')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="settings-outline"
                size={22}
                color={textoMedio}
              />
            </TouchableOpacity>
          </View>
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
                          : textoMedio
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
                          : textoSuave
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

          {/* NUEVO: aviso de tomas pendientes (solo al mirar otra cuenta) */}
          {cuentaSeleccionada !== 'mía' &&
            !cargando &&
            medicamentos.length > 0 &&
            (pendientes.length > 0 ? (
              <View style={styles.alertCard}>
                <Ionicons
                  name="alert-circle-outline"
                  size={22}
                  color="#E53935"
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>
                    {pendientes.length} toma(s) sin registrar hoy
                  </Text>

                  <Text style={styles.alertText}>
                    {pendientes
                      .map((p) => `${p.med.nombre} ${p.hora}`)
                      .join(' · ')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.alertButton}
                  onPress={avisarPersona}
                  disabled={avisando}
                  activeOpacity={0.8}
                >
                  {avisando ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.alertButtonText}>Avisar</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.okCard}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color="#2E7D32"
                />

                <Text style={styles.okText}>
                  Todas las tomas de hoy al día ✅
                </Text>
              </View>
            ))}

          {cargando ? (
            <ActivityIndicator
              size="large"
              color={primario}
              style={{ marginTop: 40 }}
            />
          ) : medicamentos.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="medkit-outline"
                  size={30}
                  color={primario}
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

                {/* NUEVO: tomas de hoy */}
                <View style={styles.separador} />

                <Text style={styles.tomasTitle}>
                  {cuentaSeleccionada === 'mía'
                    ? 'Tomas de hoy (tocá para marcar)'
                    : 'Tomas de hoy'}
                </Text>

                <View style={styles.tomasRow}>
                  {horariosDeMed(med).map((hora) => {
                    const estado = estadoToma(med, hora);
                    const esMia = cuentaSeleccionada === 'mía';

                    return (
                      <TouchableOpacity
                        key={hora}
                        disabled={!esMia}
                        onPress={() => alternarToma(med, hora)}
                        activeOpacity={0.7}
                        style={[
                          styles.tomaChip,
                          estado === 'tomada' && styles.tomaChipOk,
                          estado === 'pendiente' &&
                            styles.tomaChipPendiente,
                        ]}
                      >
                        <Ionicons
                          name={
                            estado === 'tomada'
                              ? 'checkmark-circle'
                              : 'time-outline'
                          }
                          size={16}
                          color={
                            estado === 'tomada'
                              ? '#2E7D32'
                              : estado === 'pendiente'
                              ? '#E53935'
                              : textoSuave
                          }
                        />

                        <Text style={styles.tomaChipText}>{hora}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {cuentaSeleccionada === 'mía' && (
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

            <Text style={styles.addButtonText}>Añadir</Text>
          </TouchableOpacity>
        )}

        <TabBar activa="terapia" />

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
                placeholderTextColor={textoSuave}
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


const crearEstilos = ({ primario, primarioSuave, fondo, tarjeta, texto, textoMedio, textoSuave, borde, fondoSecundario, fondoInput, peligroSuave }) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: fondo,
  },
  container: {
    flex: 1,
    backgroundColor: fondo,
  },
  header: {
    backgroundColor: tarjeta,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: borde,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: texto,
    fontSize: 26,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: fondoSecundario,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: primarioSuave,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  linkButtonText: {
    color: primario,
    fontWeight: '600',
    fontSize: 13,
  },
  selectorContainer: {
    backgroundColor: tarjeta,
    borderBottomWidth: 1,
    borderBottomColor: borde,
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
    backgroundColor: fondoSecundario,
  },
  chipActive: {
    backgroundColor: primario,
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
    color: textoMedio,
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
    color: texto,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: textoSuave,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 18,
  },
  medicamentoCard: {
    backgroundColor: tarjeta,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: borde,
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
    backgroundColor: primarioSuave,
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
    color: textoSuave,
    fontSize: 13,
    marginBottom: 3,
  },
  medicamentoNombre: {
    color: texto,
    fontSize: 20,
    fontWeight: '700',
  },
  deleteIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: peligroSuave,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  separador: {
    height: 1,
    backgroundColor: borde,
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
    backgroundColor: primarioSuave,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    color: textoSuave,
    fontSize: 13,
    marginBottom: 2,
  },
  infoValue: {
    color: texto,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: tarjeta,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: borde,
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: primarioSuave,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: texto,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    color: textoSuave,
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
    backgroundColor: tarjeta,
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: texto,
    marginBottom: 6,
  },
  modalSubtext: {
    fontSize: 13,
    color: textoSuave,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: fondoInput,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: borde,
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
    color: textoSuave,
    fontWeight: '600',
  },
  btnConfirm: {
    backgroundColor: primario,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnConfirmText: {
    color: '#FFF',
    fontWeight: '700',
  },

  // ---------- NUEVOS estilos (tomas y aviso) ----------
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: peligroSuave,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  alertTitle: {
    color: texto,
    fontWeight: '700',
    fontSize: 14,
  },
  alertText: {
    color: textoSuave,
    fontSize: 12,
    marginTop: 2,
  },
  alertButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    minWidth: 70,
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  okCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: primarioSuave,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  okText: {
    color: texto,
    fontWeight: '600',
    fontSize: 14,
  },
  tomasTitle: {
    color: textoSuave,
    fontSize: 13,
    marginBottom: 10,
  },
  tomasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tomaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: fondoSecundario,
    borderWidth: 1,
    borderColor: borde,
  },
  tomaChipOk: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  tomaChipPendiente: {
    backgroundColor: peligroSuave,
    borderColor: '#EF9A9A',
  },
  tomaChipText: {
    color: texto,
    fontWeight: '600',
    fontSize: 13,
  },
});