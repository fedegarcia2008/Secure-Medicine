import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_COLOR = '@color_primario';
const KEY_MODO = '@modo_tema';

export const COLORES_DISPONIBLES = [
  { key: 'verde', nombre: 'Verde', primario: '#4caf50', primarioSuave: '#EAF7EB', primarioSuaveOscuro: '#1F3A22' },
  { key: 'azul', nombre: 'Azul', primario: '#1e88e5', primarioSuave: '#E7F1FC', primarioSuaveOscuro: '#16293F' },
  { key: 'violeta', nombre: 'Violeta', primario: '#7e57c2', primarioSuave: '#F0EBF8', primarioSuaveOscuro: '#2A2140' },
  { key: 'rosa', nombre: 'Rosa', primario: '#d81b60', primarioSuave: '#FCE8EF', primarioSuaveOscuro: '#40202C' },
  { key: 'naranja', nombre: 'Naranja', primario: '#f57c00', primarioSuave: '#FFF1E0', primarioSuaveOscuro: '#40301A' },
  { key: 'turquesa', nombre: 'Turquesa', primario: '#00897b', primarioSuave: '#E0F2F1', primarioSuaveOscuro: '#13302D' },
];

export const OPCIONES_TEMA = [
  { key: 'claro', label: 'Claro', icono: 'sunny-outline', descripcion: 'Fondo claro' },
  { key: 'oscuro', label: 'Oscuro', icono: 'moon-outline', descripcion: 'Fondo oscuro, más cómodo de noche' },
  { key: 'sistema', label: 'Automático', icono: 'phone-portrait-outline', descripcion: 'Sigue la configuración del dispositivo' },
];

const PALETA_CLARA = {
  fondo: '#F8F9FA',
  tarjeta: '#FFFFFF',
  texto: '#1A1D1E',
  textoMedio: '#4A5359',
  textoSuave: '#6C757D',
  borde: '#E5E8EB',
  fondoSecundario: '#F1F3F5',
  fondoInput: '#F5F6F8',
  peligroSuave: '#FDECEA',
};

const PALETA_OSCURA = {
  fondo: '#121417',
  tarjeta: '#1C2024',
  texto: '#F1F3F5',
  textoMedio: '#C2C8CE',
  textoSuave: '#97A0A8',
  borde: '#2C3238',
  fondoSecundario: '#2A2F35',
  fondoInput: '#242930',
  peligroSuave: '#3B2220',
};

const COLOR_POR_DEFECTO = COLORES_DISPONIBLES[0];
const MODO_POR_DEFECTO = OPCIONES_TEMA[0];

const COLORES_INICIALES = {
  ...COLOR_POR_DEFECTO,
  ...PALETA_CLARA,
  esOscuro: false,
};

const ColorContext = createContext({
  colorActual: COLOR_POR_DEFECTO,
  modo: MODO_POR_DEFECTO.key,
  opcionTema: MODO_POR_DEFECTO,
  esOscuro: false,
  colores: COLORES_INICIALES,
  setColor: () => {},
  setModo: () => {},
});

export function ColorProvider({ children }) {
  const esquemaSistema = useColorScheme();

  const [colorActual, setColorActual] = useState(COLOR_POR_DEFECTO);
  const [modo, setModoState] = useState(MODO_POR_DEFECTO.key);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [guardadoColor, guardadoModo] = await Promise.all([
          AsyncStorage.getItem(KEY_COLOR),
          AsyncStorage.getItem(KEY_MODO),
        ]);

        const color = COLORES_DISPONIBLES.find((c) => c.key === guardadoColor);
        const opcion = OPCIONES_TEMA.find((o) => o.key === guardadoModo);

        if (color) setColorActual(color);
        if (opcion) setModoState(opcion.key);
      } catch (error) {
        console.log('Error leyendo preferencias de tema:', error);
      } finally {
        setCargado(true);
      }
    };

    cargar();
  }, []);

  const setColor = async (key) => {
    const color = COLORES_DISPONIBLES.find((c) => c.key === key);

    if (!color) return;

    setColorActual(color);

    try {
      await AsyncStorage.setItem(KEY_COLOR, key);
    } catch (error) {
      console.log('Error guardando color principal:', error);
    }
  };

  const setModo = async (key) => {
    const opcion = OPCIONES_TEMA.find((o) => o.key === key);

    if (!opcion) return;

    setModoState(key);

    try {
      await AsyncStorage.setItem(KEY_MODO, key);
    } catch (error) {
      console.log('Error guardando tema:', error);
    }
  };

  const esOscuro =
    modo === 'oscuro' || (modo === 'sistema' && esquemaSistema === 'dark');

  const colores = useMemo(
    () => ({
      ...colorActual,
      primarioSuave: esOscuro
        ? colorActual.primarioSuaveOscuro
        : colorActual.primarioSuave,
      ...(esOscuro ? PALETA_OSCURA : PALETA_CLARA),
      esOscuro,
    }),
    [colorActual, esOscuro]
  );

  const value = useMemo(
    () => ({
      colorActual,
      modo,
      opcionTema: OPCIONES_TEMA.find((o) => o.key === modo),
      esOscuro,
      colores,
      setColor,
      setModo,
    }),
    [colorActual, modo, esOscuro, colores]
  );

  if (!cargado) return null;

  return (
    <ColorContext.Provider value={value}>{children}</ColorContext.Provider>
  );
}

// Todos los colores de la app: primario, primarioSuave, fondo, tarjeta, texto, etc.
export function useColores() {
  return useContext(ColorContext).colores;
}

// Para las pantallas donde se cambia el color o el tema
export function useColorElegido() {
  return useContext(ColorContext);
}

// Recibe (colores) => StyleSheet.create({...}) y lo recalcula cuando cambia color o tema
export function useEstilos(crearEstilos) {
  const colores = useColores();

  return useMemo(() => crearEstilos(colores), [colores, crearEstilos]);
}