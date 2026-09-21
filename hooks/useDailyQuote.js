import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Requiere: npx expo install @react-native-async-storage/async-storage
//
// ZenQuotes (https://zenquotes.io) es gratuito y no pide API key, pero:
// - Free tier: máx. 5 pedidos cada 30 segundos.
// - No permite filtrar por tema sin key paga, así que filtramos localmente
//   por palabras clave relacionadas a salud / constancia / bienestar.
// - Su documentación pide mostrar atribución con link a zenquotes.io cuando
//   se usa la versión gratuita (ver <AtribucionZenQuotes /> en QuoteCard.js).
//
// Las frases de ZenQuotes vienen solo en inglés, así que se traducen con
// MyMemory (https://mymemory.translated.net), también gratis y sin API key.
// Límite anónimo: 5000 caracteres/día por IP — de sobra para 1 frase diaria.
// ---------------------------------------------------------------------------

const BATCH_KEY = 'zenquotes_batch_v1';
const DAILY_KEY = 'zenquotes_daily_v1';
const BATCH_URL = 'https://zenquotes.io/api/quotes';
const TRADUCCION_URL = 'https://api.mymemory.translated.net/get';

// Palabras relacionadas a salud / bienestar / constancia. Como el texto de
// ZenQuotes viene en inglés, las claves también van en inglés.
const PALABRAS_CLAVE = [
  'health',
  'heal',
  'strength',
  'patience',
  'courage',
  'hope',
  'peace',
  'mind',
  'body',
  'care',
  'well',
  'discipline',
  'habit',
  'better',
  'rest',
  'balance',
  'consistency',
  'perseverance',
];

function hoyISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function obtenerLote() {
  const guardado = await AsyncStorage.getItem(BATCH_KEY);
  if (guardado) {
    const { fecha, quotes } = JSON.parse(guardado);
    if (fecha === hoyISO() && Array.isArray(quotes) && quotes.length > 0) {
      return quotes;
    }
  }

  const respuesta = await fetch(BATCH_URL);
  if (!respuesta.ok) {
    throw new Error(`ZenQuotes respondió ${respuesta.status}`);
  }
  const quotes = await respuesta.json(); // [{ q, a, h }, ...]

  await AsyncStorage.setItem(
    BATCH_KEY,
    JSON.stringify({ fecha: hoyISO(), quotes })
  );

  return quotes;
}

function elegirFrase(quotes) {
  const relacionadas = quotes.filter((item) =>
    PALABRAS_CLAVE.some((palabra) => item.q.toLowerCase().includes(palabra))
  );
  const origen = relacionadas.length > 0 ? relacionadas : quotes;
  const indice = Math.floor(Math.random() * origen.length);
  return origen[indice];
}

async function traducirAlEspanol(texto) {
  const params = new URLSearchParams({ q: texto, langpair: 'en|es' });
  const respuesta = await fetch(`${TRADUCCION_URL}?${params}`);
  if (!respuesta.ok) {
    throw new Error(`MyMemory respondió ${respuesta.status}`);
  }
  const data = await respuesta.json();
  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    throw new Error('MyMemory no devolvió traducción');
  }
  return data.responseData.translatedText;
}

/**
 * Devuelve una frase "del día": la misma durante todo el día (persistida en
 * el dispositivo), y una forma de pedir otra (otraFrase) sin volver a
 * golpear la API si el lote de hoy ya está guardado.
 */
export function useDailyQuote() {
  const [frase, setFrase] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarFrase = useCallback(async (forzarNueva = false) => {
    try {
      setCargando(true);
      setError(null);

      if (!forzarNueva) {
        const guardada = await AsyncStorage.getItem(DAILY_KEY);
        if (guardada) {
          const { fecha, quote } = JSON.parse(guardada);
          if (fecha === hoyISO()) {
            setFrase(quote);
            setCargando(false);
            return;
          }
        }
      }

      const lote = await obtenerLote();
      const elegida = elegirFrase(lote);

      let q_es = null;
      try {
        q_es = await traducirAlEspanol(elegida.q);
      } catch (e) {
        // Si falla la traducción, seguimos mostrando la frase en inglés
        // en vez de romper la pantalla.
        q_es = null;
      }

      const conTraduccion = { ...elegida, q_es };

      await AsyncStorage.setItem(
        DAILY_KEY,
        JSON.stringify({ fecha: hoyISO(), quote: conTraduccion })
      );

      setFrase(conTraduccion);
    } catch (e) {
      setError(e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarFrase();
  }, [cargarFrase]);

  // Ignora la frase guardada de hoy y elige otra del mismo lote (no llama
  // de nuevo a la API salvo que el lote también haya vencido).
  const otraFrase = () => cargarFrase(true);

  return { frase, cargando, error, otraFrase };
}