import React from 'react';
import { View, Text, Image } from 'react-native';

// Colores de fondo del círculo (se combinan por código, no hace falta una imagen por color)
export const COLORES_AVATAR = [
  '#22B8F5',
  '#FFAF63',
  '#FF55AA',
  '#EA4A4A',
  '#9468E6',
  '#D12D7F',
  '#A98380',
  '#8FD3D3',
  '#1FA3A3',
];

// Un solo dibujo por animal (PNG con fondo transparente).
// Mientras no tengas las imágenes, se muestra el emoji.
// Cuando las tengas, agregá la propiedad `imagen`, por ejemplo:
//   { id: 'conejo', emoji: '🐰', imagen: require('../assets/avatares/conejo.png') }
export const ANIMALES = [
  { id: 'conejo', emoji: '🐰' },
  { id: 'zebra', imagen: require('../assets/images/cebra.png') },
  { id: 'c', emoji: '🦓' },
  { id: 'gato', emoji: '🐱' },
  { id: 'perro', emoji: '🐶' },
  { id: 'mono', emoji: '🐵' },
  { id: 'panda', emoji: '🐼' },
  { id: 'zorro', emoji: '🦊' },
  { id: 'leon', emoji: '🦁' },
  { id: 'tigre', emoji: '🐯' },
  { id: 'koala', emoji: '🐨' },
  { id: 'rana', emoji: '🐸' },
  { id: 'oso', emoji: '🐻' },
  { id: 'cerdo', emoji: '🐷' },
  { id: 'vaca', emoji: '🐮' },
  { id: 'pollito', emoji: '🐥' },
  { id: 'unicornio', emoji: '🦄' },
  { id: 'pulpo', emoji: '🐙' },
  { id: 'lechuza', emoji: '🦉' },
  { id: 'pinguino', emoji: '🐧' },
  { id: 'tortuga', emoji: '🐢' },
  { id: 'delfin', emoji: '🐬' },
    { id: 'chico', emoji: '👦' },
  { id: 'chica', emoji: '👧' },
  { id: 'nene', emoji: '🧒' },
  { id: 'hombre', emoji: '👨' },
  { id: 'mujer', emoji: '👩' },
  { id: 'persona', emoji: '🧑' },
  { id: 'abuelo', emoji: '👴' },
  { id: 'abuela', emoji: '👵' },
  { id: 'barba', emoji: '🧔' },
  { id: 'rubio', emoji: '👱‍♂️' },
  { id: 'rubia', emoji: '👱‍♀️' },
  { id: 'rulos', emoji: '👨‍🦱' },
  { id: 'rulosa', emoji: '👩‍🦱' },
  { id: 'colorado', emoji: '👨‍🦰' },
  { id: 'colorada', emoji: '👩‍🦰' },
  { id: 'canoso', emoji: '👨‍🦳' },
  { id: 'canosa', emoji: '👩‍🦳' },
  { id: 'pelado', emoji: '👨‍🦲' },
  { id: 'doctor', emoji: '👨‍⚕️' },
  { id: 'doctora', emoji: '👩‍⚕️' },
  { id: 'estudiante', emoji: '🧑‍🎓' },
  { id: 'cocinero', emoji: '🧑‍🍳' },
  { id: 'astronauta', emoji: '🧑‍🚀' },
  { id: 'superheroe', emoji: '🦸' },
  { id: 'mago', emoji: '🧙' },
  { id: 'obrero', emoji: '👷' },
];

export const AVATAR_POR_DEFECTO = {
  animal: ANIMALES[0].id,
  color: COLORES_AVATAR[0],
};

export default function Avatar({ animal, color, size = 92, fondo, style }) {
  const item = ANIMALES.find((a) => a.id === animal);
  const colorFondo = fondo || color || '#EAF7EB';

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colorFondo,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {item?.imagen ? (
        <Image
          source={item.imagen}
          style={{ width: size * 0.72, height: size * 0.72 }}
          resizeMode="contain"
        />
      ) : item ? (
        <Text style={{ fontSize: size * 0.52 }}>{item.emoji}</Text>
      ) : null}
    </View>
  );
}