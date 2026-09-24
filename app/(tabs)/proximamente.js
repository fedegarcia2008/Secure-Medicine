import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PRIMARY = '#4caf50';

const TAB_BAR_ITEMS = [
  { key: 'hoy', label: 'Hoy', icon: 'list-outline', route: '/Home' },
  { key: 'progreso', label: 'Progreso', icon: 'stats-chart-outline', route: '/progreso' },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline', route: '/noticias' },
  { key: 'terapia', label: 'Terapia', icon: 'medkit-outline', route: '/terapia' },
];

export default function Proximamente({ 
  titulo = 'Próximamente', 
  activeTab = 'progreso',
  descripcion = 'Estamos trabajando en esta sección para darte nuevas funcionalidades muy pronto.'
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tabActiva, setTabActiva] = useState(activeTab);

  const navegarTab = (item) => {
    setTabActiva(item.key);
    if (item.route) {
      router.replace(item.route);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>

        {/* TOPBAR / HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{titulo}</Text>
        </View>

        {/* CONTENIDO PRINCIPAL */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 110 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* TARJETA PRÓXIMAMENTE */}
          <View style={styles.mainCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="construct-outline" size={48} color={PRIMARY} />
            </View>

            <Text style={styles.cardTitle}>Estamos trabajando en esta sección</Text>

            <Text style={styles.cardSubtitle}>
              {descripcion}
            </Text>
          </View>
        </ScrollView>

        {/* TAB BAR INFERIOR */}
        <View
          style={[
            styles.tabBar,
            { paddingBottom: 12 + insets.bottom },
          ]}
        >
          {TAB_BAR_ITEMS.map((item) => {
            const activo = item.key === tabActiva;

            return (
              <TouchableOpacity
                key={item.key}
                style={styles.tabItem}
                onPress={() => navegarTab(item)}
                activeOpacity={0.7}
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
  // TopBar / Header
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
  },
  headerTitle: {
    color: '#1A1D1E',
    fontSize: 26,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  // Tarjeta Principal
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E8EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EAF7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  cardTitle: {
    color: '#1A1D1E',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  cardSubtitle: {
    color: '#6C757D',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
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
});