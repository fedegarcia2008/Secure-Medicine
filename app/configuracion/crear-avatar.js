import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../services/Supabase';
import Avatar, {
  ANIMALES,
  COLORES_AVATAR,
  AVATAR_POR_DEFECTO,
} from '../../components/Avatar';
import Text from '../../components/Texto';
import { useColores, useEstilos } from '../../context/ColorContext';

const PADDING = 20;
const GAP = 12;
const COLUMNAS = 4;

export default function CrearAvatar() {
  const { primario, texto, fondoSecundario } = useColores();
  const styles = useEstilos(crearEstilos);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [userId, setUserId] = useState(null);

  const [animal, setAnimal] = useState(AVATAR_POR_DEFECTO.animal);
  const [color, setColor] = useState(AVATAR_POR_DEFECTO.color);
  const [original, setOriginal] = useState(AVATAR_POR_DEFECTO);

  const tamanoItem = (width - PADDING * 2 - GAP * (COLUMNAS - 1)) / COLUMNAS;

  useEffect(() => {
    const cargar = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;
        setUserId(user.id);

        const { data: perfil } = await supabase
          .from('perfiles')
          .select('avatar_animal, avatar_color')
          .eq('id', user.id)
          .single();

        const actual = {
          animal: perfil?.avatar_animal || AVATAR_POR_DEFECTO.animal,
          color: perfil?.avatar_color || AVATAR_POR_DEFECTO.color,
        };

        setAnimal(actual.animal);
        setColor(actual.color);
        setOriginal(actual);
      } catch (error) {
        console.log('Error cargando avatar:', error);
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, []);

  const hayCambios = animal !== original.animal || color !== original.color;

  const guardar = async () => {
    if (!userId) return;
    setGuardando(true);

    try {
      const { error } = await supabase
        .from('perfiles')
        .update({ avatar_animal: animal, avatar_color: color })
        .eq('id', userId);

      if (error) {
        Alert.alert('Error', 'No se pudo guardar tu avatar.');
        return;
      }

      router.back();
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={texto} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Crea tu avatar</Text>

        <TouchableOpacity
          style={[styles.headerSide, styles.headerRight]}
          onPress={guardar}
          disabled={!hayCambios || guardando}
          activeOpacity={0.7}
        >
          {guardando ? (
            <ActivityIndicator size="small" color={primario} />
          ) : (
            <Text
              style={[styles.guardar, !hayCambios && styles.guardarDisabled]}
            >
              Guardar
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {cargando ? (
        <ActivityIndicator
          size="large"
          color={primario}
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {/* Vista previa */}
          <View style={styles.preview}>
            <Avatar animal={animal} color={color} size={170} />
          </View>

          {/* Colores */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coloresRow}
          >
            {COLORES_AVATAR.map((c) => {
              const activo = c === color;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  activeOpacity={0.8}
                  style={[styles.colorAnillo, activo && styles.colorAnilloActivo]}
                >
                  <View style={[styles.colorCirculo, { backgroundColor: c }]} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.divisor} />

          {/* Grilla de animales */}
          <View style={styles.grilla}>
            {ANIMALES.map((a) => {
              const activo = a.id === animal;
              return (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => setAnimal(a.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.itemAnillo,
                    {
                      width: tamanoItem,
                      height: tamanoItem,
                      borderRadius: tamanoItem / 2,
                    },
                    activo && styles.itemAnilloActivo,
                  ]}
                >
                  <Avatar
                    animal={a.id}
                    fondo={fondoSecundario}
                    size={tamanoItem - 10}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const crearEstilos = ({ primario, fondo, texto, borde }) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: fondo,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: PADDING,
      height: 56,
    },
    headerSide: {
      minWidth: 70,
      justifyContent: 'center',
    },
    headerRight: {
      alignItems: 'flex-end',
    },
    headerTitle: {
      flex: 1,
      color: texto,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    guardar: {
      color: primario,
      fontSize: 16,
      fontWeight: '700',
    },
    guardarDisabled: {
      opacity: 0.4,
    },
    preview: {
      alignItems: 'center',
      marginTop: 28,
      marginBottom: 28,
    },
    coloresRow: {
      paddingHorizontal: PADDING,
      gap: 12,
      paddingBottom: 18,
    },
    colorAnillo: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 2,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorAnilloActivo: {
      borderColor: primario,
    },
    colorCirculo: {
      width: 34,
      height: 34,
      borderRadius: 17,
    },
    divisor: {
      height: 1,
      backgroundColor: borde,
      marginBottom: 18,
    },
    grilla: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GAP,
      paddingHorizontal: PADDING,
    },
    itemAnillo: {
      borderWidth: 3,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemAnilloActivo: {
      borderColor: primario,
    },
  });