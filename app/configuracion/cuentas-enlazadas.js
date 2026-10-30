import React, { useCallback, useState } from 'react';
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
import Avatar, { AVATAR_POR_DEFECTO } from '../../components/Avatar';
import Text from '../../components/Texto';
import { useColores, useEstilos } from '../../context/ColorContext';

const DANGER = '#E53935';

export default function CuentasEnlazadas() {
  const { primario, texto, textoSuave } = useColores();
  const styles = useEstilos(crearEstilos);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [procesandoEnlace, setProcesandoEnlace] = useState(false);

  const cargarCuentas = async () => {
    setCargando(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('cuentas_enlazadas')
        .select(`
          observado_id,
          perfiles:observado_id (
            id,
            apodo,
            codigo,
            avatar_animal,
            avatar_color
          )
        `)
        .eq('observador_id', user.id);

      if (error) {
        console.log('Error cargando cuentas enlazadas:', error.message);
        return;
      }

      setCuentas((data || []).map((e) => e.perfiles).filter(Boolean));
    } catch (error) {
      console.log('Error en cargarCuentas:', error);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarCuentas();
    }, [])
  );

  const desvincular = (cuenta) => {
    Alert.alert(
      'Desvincular cuenta',
      `¿Querés dejar de supervisar a ${cuenta.apodo || 'esta cuenta'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
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
                Alert.alert('Error', 'No se pudo desvincular la cuenta.');
                return;
              }

              setCuentas((actuales) =>
                actuales.filter((item) => item.id !== cuenta.id)
              );
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un problema al desvincular la cuenta.');
            }
          },
        },
      ]
    );
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setCodigoIngresado('');
  };

  const handleEnlazarCuenta = async () => {
    const codigo = codigoIngresado.trim();

    if (!codigo) {
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
        { p_codigo: codigo }
      );

      const perfilEncontrado = resultado?.[0];

      if (perfilErr || !perfilEncontrado) {
        Alert.alert(
          'Código no encontrado',
          'Verificá el código e intentá nuevamente.'
        );
        return;
      }

      if (perfilEncontrado.id === user.id) {
        Alert.alert('Atención', 'No podés vincular tu propio código.');
        return;
      }

      const { error: insertErr } = await supabase
        .from('cuentas_enlazadas')
        .insert({
          observador_id: user.id,
          observado_id: perfilEncontrado.id,
        });

      if (insertErr) {
        if (insertErr.code === '23505') {
          Alert.alert('Aviso', 'Ya tenés enlazada esta cuenta.');
        } else {
          Alert.alert('Error', insertErr.message);
        }
        return;
      }

      Alert.alert(
        '¡Cuenta enlazada!',
        `Ahora podés supervisar la terapia de ${perfilEncontrado.apodo}.`
      );

      cerrarModal();
      cargarCuentas();
    } catch (error) {
      Alert.alert('Error', 'No se pudo realizar el enlace.');
    } finally {
      setProcesandoEnlace(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 32 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={texto} />
        </TouchableOpacity>

        <Text style={styles.title}>Cuentas enlazadas</Text>
        <Text style={styles.subtitle}>
          Estas son las personas cuya terapia podés supervisar.
        </Text>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
          <Text style={styles.linkButtonText}>Enlazar cuenta</Text>
        </TouchableOpacity>

        {cargando ? (
          <ActivityIndicator
            size="large"
            color={primario}
            style={{ marginTop: 40 }}
          />
        ) : cuentas.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={30} color={primario} />
            </View>

            <Text style={styles.emptyTitle}>No tenés cuentas enlazadas</Text>

            <Text style={styles.emptyText}>
              Pedile el código a la persona que querés supervisar y enlazala
              desde el botón de arriba.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            {cuentas.map((cuenta, index) => (
              <View
                key={cuenta.id}
                style={[
                  styles.row,
                  index < cuentas.length - 1 && styles.rowDivider,
                ]}
              >
                <Avatar
                  animal={cuenta.avatar_animal || AVATAR_POR_DEFECTO.animal}
                  color={cuenta.avatar_color || AVATAR_POR_DEFECTO.color}
                  size={44}
                  style={styles.avatar}
                />

                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowLabel}>
                    {cuenta.apodo || 'Sin apodo'}
                  </Text>
                  {cuenta.codigo ? (
                    <Text style={styles.rowCodigo}>Código: {cuenta.codigo}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => desvincular(cuenta)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color={DANGER} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModal}
      >
        <View style={styles.overlayModal}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enlazar cuenta</Text>

            <Text style={styles.modalSubtext}>
              Ingresá el código de la persona que querés supervisar:
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ej: ABC1234"
              placeholderTextColor={textoSuave}
              autoCapitalize="characters"
              autoCorrect={false}
              value={codigoIngresado}
              onChangeText={setCodigoIngresado}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.btnCancel} onPress={cerrarModal}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnConfirm}
                onPress={handleEnlazarCuenta}
                disabled={procesandoEnlace}
              >
                {procesandoEnlace ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.btnConfirmText}>Enlazar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const crearEstilos = ({ primario, primarioSuave, fondo, tarjeta, texto, textoSuave, borde, fondoSecundario, fondoInput, peligroSuave }) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: fondo,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: fondoSecundario,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: texto,
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
  },
  subtitle: {
    color: textoSuave,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: primario,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 24,
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  card: {
    backgroundColor: tarjeta,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: borde,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: borde,
  },
  avatar: {
    marginRight: 14,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowLabel: {
    color: texto,
    fontSize: 16,
    fontWeight: '600',
  },
  rowCodigo: {
    color: textoSuave,
    fontSize: 13,
    marginTop: 2,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: peligroSuave,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
    color: texto,
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
});