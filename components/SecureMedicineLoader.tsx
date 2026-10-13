import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useColores } from '../context/ColorContext';

/**
 * Logo de Secure Medicine que se dibuja línea por línea.
 * Pensado para pantallas de carga / splash.
 *
 * Requiere: npx expo install react-native-svg
 *
 * Uso:
 *   <SecureMedicineLoader size={160} onFinish={() => router.replace('/home')} />
 *   <SecureMedicineLoader size={160} loop />   // mientras se carga algo
 */

type Props = {
  /** Ancho en px (el alto se calcula con la proporción del logo). */
  size?: number;
  /** Color de las líneas. */
  color?: string;
  /** 1 = velocidad normal, 2 = el doble de rápido, 0.5 = más lento. */
  speed?: number;
  /** Se llama cuando termina de dibujarse (en modo loop, en cada vuelta). */
  onFinish?: () => void;
  /** Repite la animación indefinidamente. */
  loop?: boolean;
  /** Pausa (ms) al final de cada vuelta cuando loop está activo. */
  loopDelay?: number;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const VIEW_W = 113.25;
const VIEW_H = 103.5;
const STROKE = 4.01;
const TOTAL_MS = 2550;

type Shape = {
  id: string;
  d: string;
  len: number; // largo del trazo, para el efecto de dibujado
  start: number; // ms desde el inicio
  dur: number; // ms
  cap: 'round' | 'butt';
};

const SHAPES: Shape[] = [
  { id: "body", d: "M 100.95 92.15 A 8.43 8.43 0 0 1 92.52 100.58 L 11.95 100.58 A 9.9 9.9 0 0 1 2.05 90.68 L 2.05 20.97 A 9.9 9.9 0 0 1 11.95 11.07 L 91.1 11.07 A 9.9 9.9 0 0 1 101 20.97 L 101 50.8", len: 319.75, start: 0, dur: 900, cap: "round" },
  { id: "header", d: "M 2.05 29.67 L 101 29.67", len: 99.55, start: 750, dur: 350, cap: "butt" },
  { id: "ring0", d: "M 20.260 2.100 L 22.960 2.100 A 4.0 4.0 0 0 1 26.960 6.100 L 26.960 18.900 A 4.0 4.0 0 0 1 22.960 22.900 L 20.260 22.900 A 4.0 4.0 0 0 1 16.260 18.900 L 16.260 6.100 A 4.0 4.0 0 0 1 20.260 2.100 Z", len: 56.73, start: 1000, dur: 300, cap: "round" },
  { id: "ring1", d: "M 79.070 2.100 L 81.770 2.100 A 4.0 4.0 0 0 1 85.770 6.100 L 85.770 18.900 A 4.0 4.0 0 0 1 81.770 22.900 L 79.070 22.900 A 4.0 4.0 0 0 1 75.070 18.900 L 75.070 6.100 A 4.0 4.0 0 0 1 79.070 2.100 Z", len: 56.73, start: 1100, dur: 300, cap: "round" },
  { id: "cell00", d: "M 14.24 39.73 L 26.04 39.73 L 26.04 50.8 L 14.24 50.8 Z", len: 46.34, start: 1250, dur: 280, cap: "round" },
  { id: "cell10", d: "M 34.96 39.73 L 46.760000000000005 39.73 L 46.760000000000005 50.8 L 34.96 50.8 Z", len: 46.34, start: 1320, dur: 280, cap: "round" },
  { id: "cell20", d: "M 55.7 39.73 L 67.5 39.73 L 67.5 50.8 L 55.7 50.8 Z", len: 46.34, start: 1390, dur: 280, cap: "round" },
  { id: "cell30", d: "M 75.27 39.73 L 87.07 39.73 L 87.07 50.8 L 75.27 50.8 Z", len: 46.34, start: 1460, dur: 280, cap: "round" },
  { id: "cell01", d: "M 14.24 57.91 L 26.04 57.91 L 26.04 68.97999999999999 L 14.24 68.97999999999999 Z", len: 46.34, start: 1530, dur: 280, cap: "round" },
  { id: "cell11", d: "M 34.96 57.91 L 46.760000000000005 57.91 L 46.760000000000005 68.97999999999999 L 34.96 68.97999999999999 Z", len: 46.34, start: 1600, dur: 280, cap: "round" },
  { id: "cell21", d: "M 55.7 57.91 L 67.5 57.91 L 67.5 68.97999999999999 L 55.7 68.97999999999999 Z", len: 46.34, start: 1670, dur: 280, cap: "round" },
  { id: "cell02", d: "M 14.24 78.68 L 26.04 78.68 L 26.04 89.75 L 14.24 89.75 Z", len: 46.34, start: 1740, dur: 280, cap: "round" },
  { id: "cell12", d: "M 34.96 78.68 L 46.760000000000005 78.68 L 46.760000000000005 89.75 L 34.96 89.75 Z", len: 46.34, start: 1810, dur: 280, cap: "round" },
  { id: "cell22", d: "M 55.7 78.68 L 67.5 78.68 L 67.5 89.75 L 55.7 89.75 Z", len: 46.34, start: 1880, dur: 280, cap: "round" },
  { id: "heart", d: "M 92.07 65.3 C 89.5 60.8 85.5 60.2 82.3 60.4 C 76.8 60.7 73.6 64.5 74.0 69.5 C 74.6 77.0 86.0 86.5 92.07 90.8 C 98.1 86.5 109.5 77.0 110.1 69.5 C 110.5 64.5 107.3 60.7 101.8 60.4 C 98.6 60.2 94.6 60.8 92.07 65.3 Z", len: 108.77, start: 1950, dur: 600, cap: "round" },
];

export default function SecureMedicineLoader({
  size = 160,
  color,
  speed = 1,
  onFinish,
  loop = false,
  loopDelay = 600,
}: Props) {
  const { primario } = useColores();
  const colorFinal = color ?? primario;
  const progress = useRef(SHAPES.map(() => new Animated.Value(0))).current;
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let current: Animated.CompositeAnimation | undefined;

    const run = () => {
      progress.forEach((v) => v.setValue(0));
      current = Animated.parallel(
        SHAPES.map((s, i) =>
          Animated.timing(progress[i], {
            toValue: 1,
            delay: s.start / speed,
            duration: s.dur / speed,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: false, // las props de SVG no soportan el driver nativo
          })
        )
      );
      current.start(({ finished }) => {
        if (!finished || cancelled) return;
        finishRef.current?.();
        if (loop) timer = setTimeout(run, loopDelay);
      });
    };

    run();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      current?.stop();
    };
  }, [progress, speed, loop, loopDelay]);

  const height = (size * VIEW_H) / VIEW_W;

  const paths = useMemo(
    () =>
      SHAPES.map((s, i) => {
        const p = progress[i];
        return (
          <AnimatedPath
            key={s.id}
            d={s.d}
            fill="none"
            stroke={colorFinal}
            strokeWidth={STROKE}
            strokeLinecap={s.cap}
            strokeLinejoin="round"
            strokeDasharray={`${s.len} ${s.len}`}
            strokeDashoffset={p.interpolate({ inputRange: [0, 1], outputRange: [s.len, 0] })}
            // evita el puntito que dejan los extremos redondeados antes de empezar
            strokeOpacity={p.interpolate({ inputRange: [0, 0.001, 1], outputRange: [0, 1, 1] })}
          />
        );
      }),
    [progress, colorFinal]
  );

  return (
    <View style={{ width: size, height, backgroundColor: '#FFFFFF' }}>
      <Svg width={size} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        {paths}
      </Svg>
    </View>
  );
}