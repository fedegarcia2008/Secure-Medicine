// app/_layout.js
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ColorProvider, useColores } from '../context/ColorContext';
import { TamanoLetraProvider } from '../context/TamanoLetraContext';

function Contenido() {
  const { esOscuro, fondo } = useColores();

  return (
    <>
      <StatusBar style={esOscuro ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: fondo },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <ColorProvider>
      <TamanoLetraProvider>
        <Contenido />
      </TamanoLetraProvider>
    </ColorProvider>
  );
}