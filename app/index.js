import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../services/Supabase';
import SecureMedicineLoader from '../components/SecureMedicineLoader';

export default function Splash() {
  const router = useRouter();

  const handleFinish = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error al verificar la sesión:', error);
        router.replace('/login');
        return;
      }

      if (data.session) {
        // Ya hay una sesión iniciada
        router.replace('/home');
      } else {
        // No hay una sesión iniciada
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error al comprobar la sesión:', error);
      router.replace('/login');
    }
  }, [router]);

  return (
    <View style={styles.container}>
      <SecureMedicineLoader
        size={200}
        onFinish={handleFinish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});