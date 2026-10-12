import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tamano_letra';

export const OPCIONES_TAMANO = [
  { key: 'pequeno', label: 'Pequeño', escala: 0.9 },
  { key: 'mediano', label: 'Mediano', escala: 1 },
  { key: 'grande', label: 'Grande', escala: 1.15 },
  { key: 'muy-grande', label: 'Muy grande', escala: 1.3 },
];

const OPCION_POR_DEFECTO = OPCIONES_TAMANO[1];

const TamanoLetraContext = createContext({
  opcionActual: OPCION_POR_DEFECTO,
  escala: 1,
  setTamano: () => {},
});

export function TamanoLetraProvider({ children }) {
  const [opcionActual, setOpcionActual] = useState(OPCION_POR_DEFECTO);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const guardado = await AsyncStorage.getItem(STORAGE_KEY);
        const opcion = OPCIONES_TAMANO.find((o) => o.key === guardado);

        if (opcion) setOpcionActual(opcion);
      } catch (error) {
        console.log('Error leyendo tamaño de letra:', error);
      } finally {
        setCargado(true);
      }
    };

    cargar();
  }, []);

  const setTamano = async (key) => {
    const opcion = OPCIONES_TAMANO.find((o) => o.key === key);

    if (!opcion) return;

    setOpcionActual(opcion);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, key);
    } catch (error) {
      console.log('Error guardando tamaño de letra:', error);
    }
  };

  if (!cargado) return null;

  return (
    <TamanoLetraContext.Provider
      value={{ opcionActual, escala: opcionActual.escala, setTamano }}
    >
      {children}
    </TamanoLetraContext.Provider>
  );
}

export function useTamanoLetra() {
  return useContext(TamanoLetraContext);
}