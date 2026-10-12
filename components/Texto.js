import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useTamanoLetra } from '../context/TamanoLetraContext';

// Reemplaza al <Text> de react-native: aplica la escala elegida por el usuario.
export default function Text({ style, ...props }) {
  const { escala } = useTamanoLetra();

  const plano = StyleSheet.flatten(style) || {};
  const fontSize = plano.fontSize ?? 14;

  const escalado = { fontSize: Math.round(fontSize * escala * 10) / 10 };

  if (plano.lineHeight) {
    escalado.lineHeight = Math.round(plano.lineHeight * escala * 10) / 10;
  }

  return <RNText {...props} style={[style, escalado]} />;
}