import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
// AJUSTÁ esta ruta si tu archivo Supabase está en otro lugar.
// Si notificaciones.js y Supabase.js están en la misma carpeta (services), queda así:
import { supabase } from './Supabase';

const CANAL_ID = 'medicamentos';

export const FRECUENCIA_A_HORAS = {
  'Cada 4 horas': 4,
  'Cada 6 horas': 6,
  'Cada 8 horas': 8,
  'Cada 12 horas': 12,
  'Una vez al día': 24,
  'Dos veces al día': 12,
  'Tres veces al día': 8,
};

// En Expo Go de Android expo-notifications no se puede ni importar.
// En el development build (APK) y en iOS funciona normal.
const esExpoGoAndroid =
  Platform.OS === 'android' &&
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

async function cargarNotifications() {
  if (esExpoGoAndroid) {
    console.log(
      'Expo Go en Android: notificaciones desactivadas. Usá el development build.'
    );
    return null;
  }

  return await import('expo-notifications');
}

// Muestra la dosis con coma: 0.5 -> "0,5"
export function formatearDosis(n) {
  return Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
}

// Calcula los horarios del día según la frecuencia.
export function calcularHorariosDelDia(horaInicio, intervaloHoras) {
  const [hh, mm] = horaInicio.split(':').map(Number);

  const minutoInicio = hh * 60 + mm;
  const intervaloMinutos = intervaloHoras * 60;

  const cantidadTomas = Math.max(
    1,
    Math.round((24 * 60) / intervaloMinutos)
  );

  const horarios = [];

  for (let i = 0; i < cantidadTomas; i++) {
    const totalMinutos = (minutoInicio + i * intervaloMinutos) % (24 * 60);

    horarios.push({
      hour: Math.floor(totalMinutos / 60),
      minute: totalMinutos % 60,
    });
  }

  return horarios;
}

// Configura handler, canal de Android y permisos.
// Devuelve true si el permiso está concedido.
export async function configurarNotificaciones() {
  try {
    const Notifications = await cargarNotifications();
    if (!Notifications) return false;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // El canal se crea ANTES de pedir permisos (necesario en Android 13+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CANAL_ID, {
        name: 'Recordatorios de medicamentos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }

    const { status: estadoActual } = await Notifications.getPermissionsAsync();

    let estadoFinal = estadoActual;

    if (estadoActual !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      estadoFinal = status;
    }

    if (estadoFinal === 'granted') {
      console.log('Notificaciones habilitadas.');
      return true;
    }

    console.log('Permiso de notificaciones denegado.');
    return false;
  } catch (error) {
    console.log('Error configurando notificaciones:', error);
    return false;
  }
}

// NUEVO: guarda el token de push de este celular en la tabla push_tokens.
// Así otra persona (que te supervisa) puede mandarte un aviso.
export async function registrarPushToken(userId) {
  try {
    const Notifications = await cargarNotifications();
    if (!Notifications) return null;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    const { error } = await supabase.from('push_tokens').upsert({
      perfil_id: userId,
      token,
      actualizado_en: new Date().toISOString(),
    });

    if (error) {
      console.log('Error guardando push token:', error.message);
      return null;
    }

    console.log('Push token registrado.');
    return token;
  } catch (error) {
    console.log('Error registrando push token:', error);
    return null;
  }
}

// Programa las notificaciones diarias del medicamento.
// Devuelve el array de ids programados (vacío si no se pudo).
export async function programarNotificaciones({
  nombre,
  dosis,
  hora,
  frecuencia,
}) {
  try {
    const Notifications = await cargarNotifications();
    if (!Notifications) return [];

    const { status } = await Notifications.getPermissionsAsync();

    if (status !== 'granted') {
      console.log('No hay permiso para enviar notificaciones.');
      return [];
    }

    const intervaloHoras = FRECUENCIA_A_HORAS[frecuencia] || null;

    let horarios;

    if (intervaloHoras) {
      horarios = calcularHorariosDelDia(hora, intervaloHoras);
    } else {
      horarios = [
        {
          hour: Number(hora.split(':')[0]),
          minute: Number(hora.split(':')[1]),
        },
      ];
    }

    const ids = [];

    for (const { hour, minute } of horarios) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Es hora de tu medicamento 💊',
          body: `Tomá ${formatearDosis(dosis)} comprimido(s) de ${
            nombre || 'tu medicamento'
          }`,
          sound: 'default',
          data: {
            nombre: nombre || 'Medicamento',
            hora: `${String(hour).padStart(2, '0')}:${String(minute).padStart(
              2,
              '0'
            )}`,
          },
        },

        // DAILY funciona en Android e iOS. En Android el channelId va en el trigger.
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          ...(Platform.OS === 'android' && { channelId: CANAL_ID }),
        },
      });

      ids.push(id);
    }

    console.log('Notificaciones programadas:', ids);

    return ids;
  } catch (error) {
    console.log('Error programando notificaciones:', error);
    return [];
  }
}

// Cancela notificaciones puntuales (útil si después guardás los ids en Supabase).
export async function cancelarNotificaciones(ids = []) {
  try {
    const Notifications = await cargarNotifications();
    if (!Notifications) return;

    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  } catch (error) {
    console.log('Error cancelando notificaciones:', error);
  }
}

// Cancela TODAS las notificaciones programadas.
export async function cancelarTodasLasNotificaciones() {
  try {
    const Notifications = await cargarNotifications();
    if (!Notifications) return;

    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.log('Error cancelando todas las notificaciones:', error);
  }
}

// Notificación de prueba a los 5 segundos.
export async function enviarNotificacionPrueba() {
  try {
    const Notifications = await cargarNotifications();
    if (!Notifications) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Prueba 💊',
        body: 'Si ves esto, las notificaciones funcionan.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        ...(Platform.OS === 'android' && { channelId: CANAL_ID }),
      },
    });
  } catch (error) {
    console.log('Error enviando notificación de prueba:', error);
  }
}