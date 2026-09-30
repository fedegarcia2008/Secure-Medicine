import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import { useDailyQuote } from '../hooks/useDailyQuote';

export default function QuoteCard() {
  const { frase, cargando, error, otraFrase } = useDailyQuote();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={otraFrase}
      activeOpacity={0.8}
    >
      {cargando && !frase ? (
        <ActivityIndicator color="#4caf50" />
      ) : error && !frase ? (
        <Text style={styles.quote}>No se pudo cargar la frase de hoy</Text>
      ) : (
        <>
          <Text style={styles.quote}>
            “{frase.q_es || frase.q}”
          </Text>
          <Text style={styles.author}>— {frase.a}</Text>
          <Text style={styles.hint}>Toca para ver otra frase</Text>
        </>
      )}
      </TouchableOpacity>

      //<AtribucionZenQuotes /> va arriba de touchableOpacity
    
  );
}

/* ZenQuotes exige mostrar esta atribución cuando se usa la versión gratuita.
function AtribucionZenQuotes() {
  return (
    <Text
      style={styles.atribucion}
      onPress={() => Linking.openURL('https://zenquotes.io/')}
    >
      Frases de ZenQuotes API
    </Text>
  );
}*/

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#cdfbc1',
    alignItems: 'center',
  },
  quote: {
    color: '#000000',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  author: {
    color: '#606365',
    fontSize: 13,
    marginTop: 8,
  },
  hint: {
    color: '#159719',
    fontSize: 11,
    marginTop: 12,
  },


  /* atribucion: {
    color: '#455863',
    fontSize: 10,
    marginTop: 14,
    textDecorationLine: 'underline',
  },*/

});