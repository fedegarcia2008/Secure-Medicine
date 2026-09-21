import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#4CAF50';

const OPCIONES = [
  { id: 'una_vez', label: 'Una vez al día' },
  { id: 'dos_veces', label: 'Dos veces al día' },
  { id: 'mas_opciones', label: 'Necesito más opciones... (En proceso)' },
];

export default function AgregarFrecuencia() {
  const router = useRouter();
  const { nombre } = useLocalSearchParams();
  const [seleccion, setSeleccion] = useState('una_vez');

  const handleSiguiente = () => {
    router.push({
      pathname: '/recordatorio',
      params: { nombre, frecuencia: seleccion },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
        <Ionicons name="arrow-back" size={22} color="#333" />
      </Pressable>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Ilustración */}
        <View style={styles.illustration}>
          <View style={styles.phoneIcon}>
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={22} color="#fff" />
            </View>
          </View>
          <Text style={[styles.pillEmoji, { top: 10, right: 20 }]}>💊</Text>
          <Text style={[styles.pillEmoji, { bottom: 15, left: 25 }]}>💊</Text>
          <Text style={[styles.sparkle, { top: 0, left: 10 }]}>✦</Text>
          <Text style={[styles.sparkle, { bottom: 0, right: 5 }]}>✦</Text>
        </View>

        {/* Textos */}
        <Text style={styles.subtitle}>{nombre || 'Medicamento'}</Text>
        <Text style={styles.title}>¿Con qué frecuencia toma este medicamento?</Text>

        {/* Opciones */}
        <View style={styles.opciones}>
          {OPCIONES.map((op) => {
            const activo = seleccion === op.id;
            return (
              <Pressable
                key={op.id}
                style={[styles.opcionCard, activo && styles.opcionCardActiva]}
                onPress={() => setSeleccion(op.id)}
              >
                <Text style={styles.opcionTexto}>{op.label}</Text>
                <View style={[styles.radioOuter, activo && styles.radioOuterActivo]}>
                  {activo && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Botón siguiente + progreso */}
      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={handleSiguiente}>
          <Text style={styles.buttonText}>Siguiente</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 50,
  },
  backButton: {
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  illustration: {
    alignSelf: 'center',
    width: 140,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  phoneIcon: {
    width: 70,
    height: 110,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillEmoji: {
    position: 'absolute',
    fontSize: 22,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 16,
    color: '#999',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 28,
  },
  opciones: {
    gap: 12,
  },
  opcionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f6f8',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  opcionCardActiva: {
    borderColor: PRIMARY,
    backgroundColor: '#eaf7eb',
  },
  opcionTexto: {
    fontSize: 16,
    color: '#222',
    flex: 1,
    paddingRight: 10,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#bbb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActivo: {
    borderColor: PRIMARY,
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: PRIMARY,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});