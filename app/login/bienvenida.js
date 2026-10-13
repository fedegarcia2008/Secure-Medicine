import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../services/Supabase';

const imagenAbuelos = require('../../assets/images/abuelos.png');

const VERDE = '#4CAF50';
const VERDE_OSCURO = '#2E7D32';

// Proporción de abuelos.png (1200 x 685)
const PROPORCION_IMAGEN = 685 / 1200;

export default function Bienvenida() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: anchoPantalla } = useWindowDimensions();

  // Tamaño exacto de la imagen: ancho de pantalla menos los márgenes
  const anchoImagen = anchoPantalla - 48;
  const altoImagen = anchoImagen * PROPORCION_IMAGEN;

  const [hojaVisible, setHojaVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);

  const slide = useRef(new Animated.Value(300)).current;

  const abrirHoja = () => {
    setHojaVisible(true);
    slide.setValue(300);

    Animated.timing(slide, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const cerrarHoja = () => {
    Keyboard.dismiss();
    setHojaVisible(false);
  };

  const handleContinuar = async () => {
    const correo = email.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(correo)) {
      Alert.alert('Email inválido', 'Ingresá un correo electrónico válido.');
      return;
    }

    setCargando(true);

    const { data: existe, error } = await supabase.rpc('existe_email', {
      p_email: correo,
    });

    setCargando(false);

    if (error) {
      console.log('Error verificando email:', error.message);
      Alert.alert('Error', 'No se pudo verificar el email. Intentá de nuevo.');
      return;
    }

    cerrarHoja();

    // Si ya existe -> pide contraseña. Si no -> crear cuenta.
    router.push({
      pathname: existe ? '/login/password' : '/login/crear-cuenta',
      params: { email: correo },
    });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.imagenContainer}>
          <Image
            source={imagenAbuelos}
            style={{ width: anchoImagen, height: altoImagen }}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textos}>
          <Text style={styles.hola}>¡Hola!</Text>

          <Text style={styles.bienvenida}>
            Te damos la bienvenida a Secure Medicine
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.botonComenzar} onPress={abrirHoja}>
            <Text style={styles.botonComenzarTexto}>Comenzar</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {hojaVisible && (
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={cerrarHoja} />

          <Animated.View
            style={[
              styles.hoja,
              {
                paddingBottom: 28 + insets.bottom,
                transform: [{ translateY: slide }],
              },
            ]}
          >
            <Text style={styles.hojaTitulo}>Inicia sesión o regístrate</Text>

            <Text style={styles.label}>Correo electrónico</Text>

            <TextInput
              style={styles.input}
              placeholder="tucorreo@ejemplo.com"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoFocus
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              onSubmitEditing={handleContinuar}
            />

            <Pressable
              style={[styles.botonContinuar, cargando && styles.botonDeshabilitado]}
              onPress={handleContinuar}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.botonContinuarTexto}>Continuar</Text>
              )}
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: VERDE_OSCURO,
  },
  safeArea: {
    flex: 1,
    backgroundColor: VERDE_OSCURO,
  },
  imagenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  textos: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  hola: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '700',
    textAlign: 'center',
  },
  bienvenida: {
    color: '#C8E6C9',
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 36,
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  botonComenzar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonComenzarTexto: {
    color: VERDE_OSCURO,
    fontSize: 17,
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  hoja: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  hojaTitulo: {
    color: '#111',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    color: '#555',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111',
    marginBottom: 20,
  },
  botonContinuar: {
    backgroundColor: VERDE,
    borderRadius: 30,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonContinuarTexto: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
});