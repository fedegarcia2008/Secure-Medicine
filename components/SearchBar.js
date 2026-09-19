import { TextInput, StyleSheet } from 'react-native';

export default function SearchBar({ value, onChangeText }) {
  return (
    <TextInput
      style={styles.input}
      placeholder="Buscar medicamento..."
      placeholderTextColor="#999"
      value={value}
      onChangeText={onChangeText}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});