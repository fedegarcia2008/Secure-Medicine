import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import SecureMedicineLoader from '../components/SecureMedicineLoader';

export default function Splash() {
  const router = useRouter();

  const handleFinish = useCallback(() => {
    setTimeout(() => router.replace('/home'), 600);
  }, [router]);

  return (
    <View style={styles.container}>
      <SecureMedicineLoader size={200} onFinish={handleFinish} />
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