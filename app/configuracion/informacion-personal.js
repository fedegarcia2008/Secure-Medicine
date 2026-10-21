import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../services/Supabase';
import Avatar, { AVATAR_POR_DEFECTO } from '../../components/Avatar';

const PRIMARY = '#4caf50';

const OPCIONES_SEXO = ['Femenino', 'Masculino', 'Otro', 'Prefiero no decirlo'];

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from(
  { length: ANIO_ACTUAL - 1900 + 1 },
  (_, i) => ANIO_ACTUAL - i
);

function Campo({ label, children }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      {children}
    </View>
  );
}

function CampoSelector({ label, valor, placeholder, onPress }) {
  return (
    <Campo label={label}>
      <TouchableOpacity
        style={styles.input}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={valor ? styles.inputTexto : styles.inputPlaceholder}>
          {valor || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#6C757D" />
      </TouchableOpacity>
    </Campo>
  );
}

function SelectorModal({ visible, titulo, opciones, seleccionado, onSelect, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.sheetTitle}>{titulo}</Text>

          <FlatList
            data={opciones}
            keyExtractor={(item) => String(item)}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            renderItem={({ item }) => {
              const activo = item === seleccionado;

              return (
                <TouchableOpacity
                  style={[styles.sheetItem, activo && styles.sheetItemActive]}
                  onPress={() => onSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sheetItemText,
                      activo && styles.sheetItemTextActive,
                    ]}
                  >
                    {item}
                  </Text>

                  {activo && (
                    <Ionicons name="checkmark" size={20} color={PRIMARY} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function InformacionPersonal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [userId, setUserId] = useState(null);
  const [codigo, setCodigo] = useState('');

  const [apodo, setApodo] = useState('');
  const [email, setEmail] = useState('');
  const [sexo, setSexo] = useState(null);
  const [anio, setAnio] = useState(null);

  const [avatarAnimal, setAvatarAnimal] = useState(AVATAR_POR_DEFECTO.animal);
  const [avatarColor, setAvatarColor] = useState(AVATAR_POR_DEFECTO.color);

  const [original, setOriginal] = useState({
    apodo: '',
    email: '',
    sexo: null,
    anio: null,
  });

  const [selectorSexoVisible, setSelectorSexoVisible] = useState(false);
  const [selectorAnioVisible, setSelectorAnioVisible] = useState(false);

  const [modalPasswordVisible, setModalPasswordVisible] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [procesandoPassword, setProcesandoPassword] = useState(false);

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        setUserId(user.id);

        const { data: perfil, error } = await supabase
          .from('perfiles')
          .select(
            'apodo, codigo, sexo, anio_nacimiento, avatar_animal, avatar_color'
          )
          .eq('id', user.id)
          .single();

        if (error) {
          console.log('Error cargando perfil:', error.message);
        }

        const datos = {
          apodo: perfil?.apodo || '',
          email: user.email || '',
          sexo: perfil?.sexo || null,
          anio: perfil?.anio_nacimiento || null,
        };

        setApodo(datos.apodo);
        setEmail(datos.email);
        setSexo(datos.sexo);
        setAnio(datos.anio);
        setCodigo(perfil?.codigo || '');
        setAvatarAnimal(perfil?.avatar_animal || AVATAR_POR_DEFECTO.animal);
        setAvatarColor(perfil?.avatar_color || AVATAR_POR_DEFECTO.color);
        setOriginal(datos);
      } catch (error) {
        console.log('Error en cargarPerfil:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();
  }, []);

  // Al volver de CrearAvatar, refresca solo el avatar
  // (así no se pisan los datos que el usuario esté editando en esta pantalla).
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      let activo = true;

      const refrescarAvatar = async () => {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('avatar_animal, avatar_color')
          .eq('id', userId)
          .single();

        if (!activo || !perfil) return;

        setAvatarAnimal(perfil.avatar_animal || AVATAR_POR_DEFECTO.animal);
        setAvatarColor(perfil.avatar_color || AVATAR_POR_DEFECTO.color);
      };

      refrescarAvatar();

      return () => {
        activo = false;
      };
    }, [userId])
  );

  const hayCambios =
    apodo.trim() !== original.apodo ||
    email.trim().toLowerCase() !== original.email.toLowerCase() ||
    sexo !== original.sexo ||
    anio !== original.anio;

  const guardar = async () => {
    const apodoLimpio = apodo.trim();
    const emailLimpio = email.trim().toLowerCase();

    if (!apodoLimpio) {
      Alert.alert('Falta el apodo', 'Ingresá un apodo para continuar.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(emailLimpio)) {
      Alert.alert('Email inválido', 'Revisá que el email esté bien escrito.');
      return;
    }

    setGuardando(true);

    try {
      const { error: perfilErr } = await supabase
        .from('perfiles')
        .update({
          apodo: apodoLimpio,
          sexo,
          anio_nacimiento: anio,
        })
        .eq('id', userId);

      if (perfilErr) {
        Alert.alert('Error', 'No se pudieron guardar los cambios.');
        return;
      }

      let mensaje = 'Tus datos se actualizaron correctamente.';

      if (emailLimpio !== original.email.toLowerCase()) {
        const { error: emailErr } = await supabase.auth.updateUser({
          email: emailLimpio,
        });

        if (emailErr) {
          Alert.alert(
            'No se pudo cambiar el email',
            emailErr.message
          );
          setOriginal({ ...original, apodo: apodoLimpio, sexo, anio });
          return;
        }

        mensaje =
          'Guardamos tus datos. Para terminar de cambiar el email, confirmalo desde el enlace que te enviamos.';
      }

      setApodo(apodoLimpio);
      setEmail(emailLimpio);
      setOriginal({ apodo: apodoLimpio, email: emailLimpio, sexo, anio });

      Alert.alert('Cambios guardados', mensaje);
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModalPassword = () => {
    setModalPasswordVisible(false);
    setNuevaPassword('');
    setConfirmarPassword('');
  };

  const cambiarPassword = async () => {
    if (nuevaPassword.length < 6) {
      Alert.alert(
        'Contraseña muy corta',
        'La contraseña debe tener al menos 6 caracteres.'
      );
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      Alert.alert('Atención', 'Las contraseñas no coinciden.');
      return;
    }

    setProcesandoPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: nuevaPassword,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      cerrarModalPassword();
      Alert.alert('Listo', 'Tu contraseña se actualizó correctamente.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar la contraseña.');
    } finally {
      setProcesandoPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 32 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#1A1D1E" />
          </TouchableOpacity>

          <Text style={styles.title}>Información personal</Text>

          {cargando ? (
            <ActivityIndicator
              size="large"
              color={PRIMARY}
              style={{ marginTop: 40 }}
            />
          ) : (
            <>
              <View style={styles.avatarBlock}>
                <TouchableOpacity
                  style={styles.avatarWrapper}
                  onPress={() => router.push('/configuracion/crear-avatar')}
                  activeOpacity={0.8}
                >
                  <Avatar
                    animal={avatarAnimal}
                    color={avatarColor}
                    size={92}
                    style={styles.avatarBorde}
                  />
                  <View style={styles.editBadge}>
                    <Ionicons name="pencil" size={13} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                <Text style={styles.avatarTitle}>Detalles del perfil</Text>

                {codigo ? (
                  <Text style={styles.avatarCodigo}>Tu código: {codigo}</Text>
                ) : null}
              </View>

              <View style={styles.card}>
                <Campo label="Apodo">
                  <TextInput
                    style={styles.input}
                    value={apodo}
                    onChangeText={setApodo}
                    placeholder="¿Cómo te llamamos?"
                    placeholderTextColor="#999"
                    maxLength={30}
                  />
                </Campo>

                <Campo label="Email">
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@email.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </Campo>

                <CampoSelector
                  label="Sexo"
                  valor={sexo}
                  placeholder="Seleccionar"
                  onPress={() => setSelectorSexoVisible(true)}
                />

                <CampoSelector
                  label="Año de nacimiento"
                  valor={anio ? String(anio) : null}
                  placeholder="Seleccionar"
                  onPress={() => setSelectorAnioVisible(true)}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!hayCambios || guardando) && styles.saveButtonDisabled,
                ]}
                onPress={guardar}
                disabled={!hayCambios || guardando}
                activeOpacity={0.85}
              >
                {guardando ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.sectionLabel}>Seguridad</Text>

              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.passwordRow}
                  onPress={() => setModalPasswordVisible(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={PRIMARY}
                    />
                  </View>

                  <Text style={styles.rowLabel}>Cambiar contraseña</Text>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#6C757D"
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <SelectorModal
        visible={selectorSexoVisible}
        titulo="Sexo"
        opciones={OPCIONES_SEXO}
        seleccionado={sexo}
        onClose={() => setSelectorSexoVisible(false)}
        onSelect={(valor) => {
          setSexo(valor);
          setSelectorSexoVisible(false);
        }}
      />

      <SelectorModal
        visible={selectorAnioVisible}
        titulo="Año de nacimiento"
        opciones={ANIOS}
        seleccionado={anio}
        onClose={() => setSelectorAnioVisible(false)}
        onSelect={(valor) => {
          setAnio(valor);
          setSelectorAnioVisible(false);
        }}
      />

      <Modal
        visible={modalPasswordVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModalPassword}
      >
        <View style={styles.overlayCentro}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cambiar contraseña</Text>

            <Text style={styles.modalSubtext}>
              Ingresá tu nueva contraseña (mínimo 6 caracteres).
            </Text>

            <TextInput
              style={[styles.input, styles.modalInput]}
              placeholder="Nueva contraseña"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              value={nuevaPassword}
              onChangeText={setNuevaPassword}
            />

            <TextInput
              style={[styles.input, styles.modalInput]}
              placeholder="Repetir contraseña"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              value={confirmarPassword}
              onChangeText={setConfirmarPassword}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={cerrarModalPassword}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnConfirm}
                onPress={cambiarPassword}
                disabled={procesandoPassword}
              >
                {procesandoPassword ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.btnConfirmText}>Cambiar</Text>
                )}
              </TouchableOpacity>
            </View>
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
  flex: {
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
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#1A1D1E',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
  },
  avatarBlock: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 92,
    height: 92,
  },
  avatarBorde: {
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    borderWidth: 2,
    borderColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTitle: {
    color: '#1A1D1E',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
  },
  avatarCodigo: {
    color: '#6C757D',
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    padding: 18,
  },
  campo: {
    marginBottom: 16,
  },
  campoLabel: {
    color: '#888888',
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F6F8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1D1E',
  },
  inputTexto: {
    color: '#1A1D1E',
    fontSize: 15,
  },
  inputPlaceholder: {
    color: '#999',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionLabel: {
    color: '#4A5359',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 10,
    marginLeft: 2,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EAF7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowLabel: {
    flex: 1,
    color: '#1A1D1E',
    fontSize: 16,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    maxHeight: '60%',
  },
  sheetTitle: {
    color: '#1A1D1E',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  sheetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  sheetItemActive: {
    backgroundColor: '#EAF7EB',
  },
  sheetItemText: {
    color: '#1A1D1E',
    fontSize: 16,
  },
  sheetItemTextActive: {
    color: PRIMARY,
    fontWeight: '700',
  },
  overlayCentro: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
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
    marginBottom: 12,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
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