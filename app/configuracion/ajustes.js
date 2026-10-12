import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../services/Supabase';

const PRIMARY = '#4caf50';
const DANGER = '#E53935';

function SettingRow({ icon, label, value, onPress, danger, last }) {
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
          color={danger ? DANGER : PRIMARY}
        />
      </View>

      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>
        {label}
      </Text>

      {value ? <Text style={styles.rowValue}>{value}</Text> : null}

      <Ionicons name="chevron-forward" size={20} color="#6C757D" />
    </TouchableOpacity>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export default function Ajustes() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
          <Ionicons name="arrow-back" size={22} color="#1A1D1E" />
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
            value="Claro"
            onPress={() => proximamente('Tema')}
          />
          <SettingRow
            icon="text-outline"
            label="Tamaño de letra"
            value="Mediano"
            onPress={() => proximamente('Tamaño de letra')}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#1A1D1E',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    color: '#4A5359',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E8EB',
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
    borderBottomColor: '#E5E8EB',
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
  rowIconDanger: {
    backgroundColor: '#FDECEA',
  },
  rowLabel: {
    flex: 1,
    color: '#1A1D1E',
    fontSize: 16,
    fontWeight: '500',
  },
  rowLabelDanger: {
    color: DANGER,
  },
  rowValue: {
    color: '#6C757D',
    fontSize: 14,
    marginRight: 6,
  },
});