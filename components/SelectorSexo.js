import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList } from 'react-native';

const OPCIONES = [
  { label: 'Masculino', value: 'masculino' },
  { label: 'Femenino', value: 'femenino' },
  { label: 'Prefiero no decirlo', value: 'no_decir' },
];

export default function SelectorSexo({ value, onValueChange }) {
  const [abierto, setAbierto] = useState(false);

  const opcionSeleccionada = OPCIONES.find((o) => o.value === value);

  return (
    <View>
      <Pressable style={styles.selector} onPress={() => setAbierto(true)}>
        <Text style={opcionSeleccionada ? styles.textoSeleccionado : styles.placeholder}>
          {opcionSeleccionada ? opcionSeleccionada.label : 'Sexo'}
        </Text>
        <Text style={styles.flecha}>▾</Text>
      </Pressable>

      <Modal visible={abierto} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setAbierto(false)}>
          <View style={styles.menu}>
            <FlatList
              data={OPCIONES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.opcion}
                  onPress={() => {
                    onValueChange(item.value);
                    setAbierto(false);
                  }}
                >
                  <Text
                    style={[
                      styles.opcionTexto,
                      item.value === value && styles.opcionTextoActiva,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
  },
  textoSeleccionado: {
    fontSize: 16,
    color: '#000',
  },
  flecha: {
    fontSize: 14,
    color: '#999',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 30,
  },
  menu: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
  },
  opcion: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  opcionTexto: {
    fontSize: 16,
    color: '#333',
  },
  opcionTextoActiva: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});