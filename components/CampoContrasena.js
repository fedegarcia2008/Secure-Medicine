import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VERDE = '#4CAF50';

export default function CampoContrasena({
  value,
  onChangeText,
  placeholder,
  autoFocus = false,
  returnKeyType,
  onSubmitEditing,
}) {
  const [visible, setVisible] = useState(false);
  const [enfocado, setEnfocado] = useState(false);

  return (
    <View style={[styles.box, enfocado && styles.boxEnfocado]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        value={value}
        onChangeText={onChangeText}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
      />

      <TouchableOpacity onPress={() => setVisible((v) => !v)} hitSlop={10}>
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color="#888"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    paddingHorizontal: 15,
  },
  boxEnfocado: {
    borderColor: VERDE,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    color: '#111',
  },
});