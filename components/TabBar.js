import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Text from './Texto';
import { useColores, useEstilos } from '../context/ColorContext';

export const TAB_BAR_HEIGHT = 56;

export const TAB_BAR_ITEMS = [
  { key: 'hoy', label: 'Home', icon: 'list-outline', route: '/home' },
  { key: 'progreso', label: 'Progreso', icon: 'stats-chart-outline', route: '/progreso' },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline', route: '/noticias' },
  { key: 'terapia', label: 'Terapia', icon: 'medkit-outline', route: '/terapia' },
];

export default function TabBar({ activa = 'hoy' }) {
  const { primario, textoSuave } = useColores();
  const styles = useEstilos(crearEstilos);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const irATab = (item) => {
    if (item.key === activa) return; // evita recargar la pantalla actual
    router.replace(item.route);
  };

  return (
    <View style={[styles.tabBar, { paddingBottom: 12 + insets.bottom }]}>
      {TAB_BAR_ITEMS.map((item) => {
        const esActivo = item.key === activa;

        return (
          <TouchableOpacity
            key={item.key}
            style={styles.tabItem}
            onPress={() => irATab(item)}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={esActivo ? primario : textoSuave}
            />

            <Text style={[styles.tabLabel, esActivo && styles.tabLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const crearEstilos = ({ primario, tarjeta, textoSuave, borde }) =>
  StyleSheet.create({
    tabBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '100%',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: borde,
      backgroundColor: tarjeta,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    tabLabel: {
      fontSize: 12,
      color: textoSuave,
    },
    tabLabelActive: {
      color: primario,
      fontWeight: '600',
    },
  });