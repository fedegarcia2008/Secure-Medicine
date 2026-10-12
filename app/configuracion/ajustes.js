import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../services/Supabase';
import Text from '../../components/Texto';
import { useColorElegido, useColores, useEstilos } from '../../context/ColorContext';
import { useTamanoLetra } from '../../context/TamanoLetraContext';

const DANGER = '#E53935';

function SettingRow({ icon, label, value, onPress, danger, last }) {
  const { primario, textoSuave } = useColores();
  const styles = useEstilos(crearEstilos);
  return (
    <TouchableOpacity
      style={[styles.row, !last && styles.rowDivider]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? DANGER : primario}
        />
      </View>

      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>
        {label}
      </Text>

      {value ? <Text style={styles.rowValue}>{value}</Text> : null}

      <Ionicons name="chevron-forward" size={20} color={textoSuave} />
    </TouchableOpacity>
  );
}

function Section({ title, children }) {
  const styles = useEstilos(crearEstilos);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export default function Ajustes() {
  const { texto } = useColores();
  const styles = useEstilos(crearEstilos);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { opcionActual } = useTamanoLetra();
  const colorActual = useColores();
  const { opcionTema } = useColorElegido();

  // Se irán reemplazando por router.push('/ruta') a medida que armemos cada sección
  const proximamente = (nombre) => {
    Alert.alert(nombre, 'Esta sección estará disponible pronto.');
  };

  const confirmarCerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Querés cerrar tu sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();

              if (error) {
                Alert.alert('Error', 'No se pudo cerrar la sesión.');
                return;
              }

              // Cambiá '/' por la ruta de tu pantalla de login si es otra
              router.replace('/');
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un problema al cerrar la sesión.');
            }
          },
        },
      ]
    );
  };

  const confirmarEliminarCuenta = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Se borrarán tu cuenta y todos tus datos. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => proximamente('Eliminar cuenta'),
        },
      ]
    );
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

        <Text style={styles.title}>Ajustes</Text>

        <Section title="Cuenta">
          <SettingRow
            icon="person-outline"
            label="Información personal"
            onPress={() => router.push('/configuracion/informacion-personal')}
          />
          <SettingRow
            icon="people-outline"
            label="Cuentas enlazadas"
            onPress={() => proximamente('Cuentas enlazadas')}
            last
          />
        </Section>

        <Section title="Preferencias">
          <SettingRow
            icon="contrast-outline"
            label="Tema"
            value={opcionTema.label}
            onPress={() => router.push('/configuracion/tema')}
          />
          <SettingRow
            icon="color-palette-outline"
            label="Color principal"
            value={colorActual.nombre}
            onPress={() => router.push('/configuracion/color')}
          />
          <SettingRow
            icon="text-outline"
            label="Tamaño de letra"
            value={opcionActual.label}
            onPress={() => router.push('/configuracion/tamano-letra')}
            last
          />
        </Section>

        <Section title="Otros">
          <SettingRow
            icon="trash-outline"
            label="Eliminar cuenta"
            danger
            onPress={confirmarEliminarCuenta}
          />
          <SettingRow
            icon="log-out-outline"
            label="Cerrar sesión"
            danger
            onPress={confirmarCerrarSesion}
            last
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const crearEstilos = ({ primario, primarioSuave, fondo, tarjeta, texto, textoMedio, textoSuave, borde, fondoSecundario, fondoInput, peligroSuave }) => StyleSheet.create({
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
    marginBottom: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    color: textoMedio,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 2,
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
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: primarioSuave,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowIconDanger: {
    backgroundColor: peligroSuave,
  },
  rowLabel: {
    flex: 1,
    color: texto,
    fontSize: 16,
    fontWeight: '500',
  },
  rowLabelDanger: {
    color: DANGER,
  },
  rowValue: {
    color: textoSuave,
    fontSize: 14,
    marginRight: 6,
  },
});