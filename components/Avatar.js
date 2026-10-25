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

// Un solo dibujo por animal (PNG acon fondo transparente).
// Mientras no tengas las imágenes, se muestra el emoji.
// Cuando las tengas, agregá la propiedad `imagen`, por ejemplo:
//   { id: 'conejo', emoji: '🐰', imagen: require('../assets/avatares/conejo.png') }
export const ANIMALES = [
  { id: 'conejo', imagen: require('../assets/images/avatar/conejo.png') },
  { id: 'zebra', imagen: require('../assets/images/avatar/cebra.png') },
  { id: 'gato', imagen: require('../assets/images/avatar/gato.png') },
  { id: 'perro', imagen: require('../assets/images/avatar/perro.png') },
  { id: 'mono', imagen: require('../assets/images/avatar/mono.png') },
  { id: 'panda', imagen: require('../assets/images/avatar/panda.png') },
  { id: 'zorro', imagen: require('../assets/images/avatar/zorro.png') },
  { id: 'mapache', imagen: require('../assets/images/avatar/mapache.png') },
  { id: 'hipopotamo', imagen: require('../assets/images/avatar/hipopotamo.png') },
  { id: 'castor', imagen: require('../assets/images/avatar/castor.png') },
  { id: 'leon', imagen: require('../assets/images/avatar/leon.png') },
  { id: 'leopardo', imagen: require('../assets/images/avatar/leopardo.png') },
  { id: 'lobo', imagen: require('../assets/images/avatar/lobo.png') },
  { id: 'pato', imagen: require('../assets/images/avatar/pato.png') },
  { id: 'jirafa', imagen: require('../assets/images/avatar/jirafa.png') },
  { id: 'morsa', imagen: require('../assets/images/avatar/morsa.png') },
  { id: 'cocodrilo', imagen: require('../assets/images/avatar/cocodrilo.png') },
  { id: 'serpiente', imagen: require('../assets/images/avatar/serpiente.png') },
  { id: 'elefante', imagen: require('../assets/images/avatar/elefante.png') },
  { id: 'rinoceronte', imagen: require('../assets/images/avatar/rinoceronte.png') },
  { id: 'ciervo', imagen: require('../assets/images/avatar/ciervo.png') },
  { id: 'reptil', imagen: require('../assets/images/avatar/reptil.png') },
  { id: 'oveja', imagen: require('../assets/images/avatar/oveja.png') },
  { id: 'koala', imagen: require('../assets/images/avatar/koala.png') },
  { id: 'rana', imagen: require('../assets/images/avatar/rana.png') },
  { id: 'oso', imagen: require('../assets/images/avatar/oso.png') },
  { id: 'cerdo', imagen: require('../assets/images/avatar/cerdo.png') },
  { id: 'vaca', imagen: require('../assets/images/avatar/vaca.png') },
  { id: 'pollo', imagen: require('../assets/images/avatar/pollo.png') },
  { id: 'calamar', imagen: require('../assets/images/avatar/calamar.png') },
  { id: 'buho', imagen: require('../assets/images/avatar/buho.png') },
  { id: 'pinguino', imagen: require('../assets/images/avatar/pinguino.png') },
  { id: 'tortuga', imagen: require('../assets/images/avatar/tortuga.png') },
  { id: 'tiburon', imagen: require('../assets/images/avatar/tiburon.png') },
  { id: 'loro', imagen: require('../assets/images/avatar/loro.png') },
  { id: 'mariposa', imagen: require('../assets/images/avatar/mariposa.png') },

  { id: 'anciano1', imagen: require('../assets/images/avatar/anciano.png') },
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