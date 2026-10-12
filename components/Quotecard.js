import React from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import { useDailyQuote } from '../hooks/useDailyQuote';
import Text from './Texto';
import { useColores, useEstilos } from '../context/ColorContext';

export default function QuoteCard() {
  const { frase, cargando, error, otraFrase } = useDailyQuote();
  const { primario } = useColores();
  const styles = useEstilos(crearEstilos);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={otraFrase}
        activeOpacity={0.8}
      >
        {cargando && !frase ? (
          <ActivityIndicator color={primario} />
        ) : error && !frase ? (
          <Text style={styles.quote}>
            No se pudo cargar la frase de hoy
          </Text>
        ) : (
          <>
            <Text style={styles.quote}>
              “{frase.q_es || frase.q}”
            </Text>

            <Text style={styles.author}>
              — {frase.a}
            </Text>

            <Text style={styles.hint}>
              Toca para ver otra frase
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Atribución opcional de ZenQuotes */}
      {/* <AtribucionZenQuotes styles={styles} /> */}
    </View>
  );
}

/*
function AtribucionZenQuotes({ styles }) {
  return (
    <Text
      style={styles.atribucion}
      onPress={() => Linking.openURL('https://zenquotes.io/')}
    >
      Frases de ZenQuotes API
    </Text>
  );
}
*/

const crearEstilos = ({
  primario,
  primarioSuave,
  tarjeta,
  texto,
  textoSuave,
  borde,
}) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },

    card: {
      width: '100%',
      padding: 20,
      borderRadius: 18,
      backgroundColor: primarioSuave || tarjeta,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: borde,
    },

    quote: {
      color: texto,
      fontSize: 16,
      fontStyle: 'italic',
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 24,
    },

    author: {
      color: textoSuave,
      fontSize: 13,
      fontWeight: '600',
      marginTop: 10,
      textAlign: 'center',
    },

    hint: {
      color: primario,
      fontSize: 12,
      fontWeight: '600',
      marginTop: 12,
      textAlign: 'center',
    },

    atribucion: {
      color: textoSuave,
      fontSize: 10,
      marginTop: 12,
      textDecorationLine: 'underline',
      textAlign: 'center',
    },
  });