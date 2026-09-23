import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const PRIMARY = '#4CAF50';

const STORAGE_KEY = '@medicamentos_terapia';

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];



const FRECUENCIA_A_HORAS = {
  'Cada 4 horas': 4,
  'Cada 6 horas': 6,
  'Cada 8 horas': 8,
  'Cada 12 horas': 12,
  'Una vez al día': 24,
  'Dos veces al día': 12,
  'Tres veces al día': 8,
};

function obtenerIntervaloHoras(frecuencia) {
  return FRECUENCIA_A_HORAS[frecuencia] ?? null;
}


function calcularHorariosDelDia(horaInicio, intervaloHoras) {
  const [hh, mm] = horaInicio.split(':').map(Number);

  const minutoInicio = hh * 60 + mm;
  const intervaloMin = intervaloHoras * 60;

  const cantidadTomas = Math.max(
    1,
    Math.round((24 * 60) / intervaloMin)
  );

  const horarios = [];

  for (let i = 0; i < cantidadTomas; i++) {
    const totalMin =
      (minutoInicio + i * intervaloMin) % (24 * 60);

    horarios.push({
      hour: Math.floor(totalMin / 60),
      minute: totalMin % 60,
    });
  }

  return horarios;
}



Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function formatearFecha(date) {
  const hoy = new Date();

  const esHoy =
    date.getDate() === hoy.getDate() &&
    date.getMonth() === hoy.getMonth() &&
    date.getFullYear() === hoy.getFullYear();

  if (esHoy) return 'Hoy';

  return `${date.getDate()} ${
    MESES[date.getMonth()]
  .slice(0, 3)} ${date.getFullYear()}`;
}


function generarDiasDelMes(mesRef) {
  const anio = mesRef.getFullYear();
  const mes = mesRef.getMonth();

  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);

  
  const diaSemanaInicio = (primerDia.getDay() + 6) % 7;

  const dias = [];

  for (let i = 0; i < diaSemanaInicio; i++) {
    dias.push(null);
  }

  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    dias.push(new Date(anio, mes, d));
  }

  return dias;
}

export default function Recordatorio() {
  const router = useRouter();

  const { nombre, frecuencia } = useLocalSearchParams();



  const [fechaInicio, setFechaInicio] = useState(new Date());

  const [calendarioVisible, setCalendarioVisible] = useState(false);

  const [mesVisible, setMesVisible] = useState(new Date());

 

  const [hora, setHora] = useState('08:00');

  const [horaTemp, setHoraTemp] = useState('08:00');

  const [horaVisible, setHoraVisible] = useState(false);

  

  const [dosis, setDosis] = useState(1);

  const [dosisTemp, setDosisTemp] = useState('1');

  const [dosisVisible, setDosisVisible] = useState(false);


  const [limiteDosis, setLimiteDosis] = useState(30);

  const [limiteTemp, setLimiteTemp] = useState('30');

  const [limiteVisible, setLimiteVisible] = useState(false);

  

  const [guardando, setGuardando] = useState(false);



  const diasDelMes = useMemo(
    () => generarDiasDelMes(mesVisible),
    [mesVisible]
  );

  const cambiarMes = (delta) => {
    setMesVisible(
      new Date(
        mesVisible.getFullYear(),
        mesVisible.getMonth() + delta,
        1
      )
    );
  };

  

  useEffect(() => {
    (async () => {
      const { status: statusActual } =
        await Notifications.getPermissionsAsync();

      let statusFinal = statusActual;

      if (statusActual !== 'granted') {
        const { status } =
          await Notifications.requestPermissionsAsync();

        statusFinal = status;
      }

      if (statusFinal !== 'granted') {
        console.log(
          'Permiso de notificaciones denegado. No se podrán programar recordatorios.'
        );
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(
          'default',
          {
            name: 'Recordatorios de medicamentos',
            importance:
              Notifications.AndroidImportance.HIGH,
            sound: true,
          }
        );
      }
    })();
  }, []);



  const confirmarHora = () => {
    const limpio = horaTemp.replace(/[^0-9:]/g, '');

    const match = limpio.match(
      /^([0-1]?[0-9]|2[0-3]):?([0-5][0-9])$/
    );

    if (match) {
      const hh = match[1].padStart(2, '0');
      const mm = match[2];

      setHora(`${hh}:${mm}`);

      setHoraVisible(false);
    }
  };

  const handleHoraTextChange = (texto) => {
    
    const numeros = texto
      .replace(/[^0-9]/g, '')
      .slice(0, 4);

    if (numeros.length <= 2) {
      setHoraTemp(numeros);
    } else {
      setHoraTemp(
        `${numeros.slice(0, 2)}:${numeros.slice(2)}`
      );
    }
  };

  

  const confirmarDosis = () => {
    const n = parseFloat(
      dosisTemp.replace(',', '.')
    );

    if (!isNaN(n) && n > 0) {
      setDosis(n);
    }

    setDosisVisible(false);
  };

  const formatearDosis = (n) => {
    return Number.isInteger(n)
      ? String(n)
      : String(n).replace('.', ',');
  };



  const confirmarLimite = () => {
    const n = parseInt(limiteTemp, 10);

    if (!isNaN(n) && n > 0) {
      setLimiteDosis(n);
    }

    setLimiteVisible(false);
  };


  const programarNotificaciones = async () => {
    try {
      const { status } =
        await Notifications.getPermissionsAsync();

      if (status !== 'granted') {
        console.log(
          'No hay permiso para programar notificaciones.'
        );
        return [];
      }

      const intervaloHoras = obtenerIntervaloHoras(frecuencia);

      const horarios = intervaloHoras
        ? calcularHorariosDelDia(hora, intervaloHoras)
        : [
            {
              hour: Number(hora.split(':')[0]),
              minute: Number(hora.split(':')[1]),
            },
          ];

      const ids = [];

      for (const { hour: hh, minute: mm } of horarios) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Es hora de tu medicamento 💊',
            body: `Tomá ${formatearDosis(dosis)} comprimido(s) de ${
              nombre || 'tu medicamento'
            }`,
            sound: true,
            data: {
              nombre: nombre || 'Medicamento',
              hora: `${String(hh).padStart(2, '0')}:${String(
                mm
              ).padStart(2, '0')}`,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: hh,
            minute: mm,
            repeats: true,
          },
        });

        ids.push(id);
      }

      console.log('Notificaciones programadas:', ids);

      return ids;
    } catch (error) {
      console.log(
        'Error programando notificaciones:',
        error
      );
      return [];
    }
  };


  const handleSiguiente = async () => {
    if (guardando) return;

    setGuardando(true);

    try {
     
      const notificationIds = await programarNotificaciones();

      // Buscamos los medicamentos que ya están guardados.
      const datosGuardados = await AsyncStorage.getItem(
        STORAGE_KEY
      );

      const medicamentosGuardados = datosGuardados
        ? JSON.parse(datosGuardados)
        : [];

     
      const nuevoMedicamento = {
        id: Date.now().toString(),

        nombre: nombre || 'Medicamento',

        frecuencia:
          frecuencia || 'No especificado',

        fechaInicio:
          fechaInicio.toISOString(),

        hora,

        dosis: String(dosis),

        limiteDosis: String(limiteDosis),

        notificationIds,
      };

      
      const medicamentosActualizados = [
        ...medicamentosGuardados,
        nuevoMedicamento,
      ];

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          medicamentosActualizados
        )
      );

      router.replace('/terapia');

    } catch (error) {
      console.log(
        'Error guardando medicamento:',
        error
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={styles.container}>

      
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        hitSlop={10}
      >
        <Ionicons
          name="arrow-back"
          size={22}
          color="#333"
        />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        

        <View style={styles.illustration}>

          <Text style={styles.bellEmoji}>
            🔔
          </Text>

          <View style={styles.phoneIcon}>
            <View style={styles.screenBar} />
          </View>

        </View>

        

        <Text style={styles.subtitle}>
          {nombre || 'Medicamento'}
        </Text>

        <Text style={styles.title}>
          ¿Cuándo quieres que te lo recuerden?
        </Text>

       

        <View style={styles.campos}>

          

          <Pressable
            style={styles.campoRow}
            onPress={() => {
              setMesVisible(fechaInicio);
              setCalendarioVisible(true);
            }}
          >

            <Text style={styles.campoLabel}>
              Fecha de inicio
            </Text>

            <View style={styles.campoValorContainer}>

              <Text style={styles.campoValor}>
                {formatearFecha(fechaInicio)}
              </Text>

              <Ionicons
                name="chevron-down"
                size={18}
                color={PRIMARY}
              />

            </View>

          </Pressable>

          <View style={styles.separador} />

        

          <Pressable
            style={styles.campoRow}
            onPress={() => {
              setHoraTemp(hora);
              setHoraVisible(true);
            }}
          >

            <Text style={styles.campoLabel}>
              Hora
            </Text>

            <View style={styles.campoValorContainer}>

              <Text style={styles.campoValor}>
                {hora}
              </Text>

              <Ionicons
                name="chevron-down"
                size={18}
                color={PRIMARY}
              />

            </View>

          </Pressable>

          <View style={styles.separador} />

          {/* DOSIS */}

          <Pressable
            style={styles.campoRow}
            onPress={() => {
              setDosisTemp(
                formatearDosis(dosis)
              );

              setDosisVisible(true);
            }}
          >

            <Text style={styles.campoLabel}>
              Dosis
            </Text>

            <View style={styles.campoValorContainer}>

              <Text style={styles.campoValor}>
                {formatearDosis(dosis)} comprimido(s)
              </Text>

              <Ionicons
                name="chevron-down"
                size={18}
                color={PRIMARY}
              />

            </View>

          </Pressable>

        </View>

       

        <View
          style={[
            styles.campos,
            { marginTop: 16 },
          ]}
        >

          <Pressable
            style={styles.campoRow}
            onPress={() => {
              setLimiteTemp(
                String(limiteDosis)
              );

              setLimiteVisible(true);
            }}
          >

            <Text style={styles.campoLabel}>
              Límite de dosis
            </Text>

            <View style={styles.campoValorContainer}>

              <Text style={styles.campoValor}>
                {limiteDosis} comprimido(s)
              </Text>

              <Ionicons
                name="chevron-down"
                size={18}
                color={PRIMARY}
              />

            </View>

          </Pressable>

        </View>

      </ScrollView>

      {/* BOTÓN GUARDAR */}

      <View style={styles.footer}>

        <Pressable
          style={[
            styles.button,
            guardando && { opacity: 0.6 },
          ]}
          onPress={handleSiguiente}
          disabled={guardando}
        >

          <Text style={styles.buttonText}>
            {guardando
              ? 'Guardando...'
              : 'Guardar Registro'}
          </Text>

        </Pressable>

      </View>

      {/* ========================= */}
      {/* MODAL CALENDARIO */}
      {/* ========================= */}

      <Modal
        visible={calendarioVisible}
        transparent
        animationType="fade"
      >

        <Pressable
          style={styles.overlay}
          onPress={() =>
            setCalendarioVisible(false)
          }
        >

          <Pressable
            style={styles.modalCard}
            onPress={() => {}}
          >

            <View style={styles.calendarHeader}>

              <Pressable
                onPress={() => cambiarMes(-1)}
                hitSlop={10}
              >
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color="#333"
                />
              </Pressable>

              <Text style={styles.calendarTitulo}>
                {MESES[mesVisible.getMonth()]}{' '}
                {mesVisible.getFullYear()}
              </Text>

              <Pressable
                onPress={() => cambiarMes(1)}
                hitSlop={10}
              >
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color="#333"
                />
              </Pressable>

            </View>

            <View style={styles.semanaRow}>

              {DIAS_SEMANA.map((d) => (
                <Text
                  key={d}
                  style={styles.diaSemanaTexto}
                >
                  {d}
                </Text>
              ))}

            </View>

            <View style={styles.diasGrid}>

              {diasDelMes.map((dia, i) => {

                if (!dia) {
                  return (
                    <View
                      key={`vacio-${i}`}
                      style={styles.diaCelda}
                    />
                  );
                }

                const seleccionado =
                  dia.getDate() === fechaInicio.getDate() &&
                  dia.getMonth() === fechaInicio.getMonth() &&
                  dia.getFullYear() === fechaInicio.getFullYear();

                return (
                  <Pressable
                    key={dia.toISOString()}
                    style={[
                      styles.diaCelda,
                      seleccionado &&
                        styles.diaCeldaActiva,
                    ]}
                    onPress={() => {
                      setFechaInicio(dia);
                      setCalendarioVisible(false);
                    }}
                  >

                    <Text
                      style={[
                        styles.diaTexto,
                        seleccionado &&
                          styles.diaTextoActivo,
                      ]}
                    >
                      {dia.getDate()}
                    </Text>

                  </Pressable>
                );
              })}

            </View>

          </Pressable>

        </Pressable>

      </Modal>

     

      <Modal
        visible={horaVisible}
        transparent
        animationType="fade"
      >

        <Pressable
          style={styles.overlay}
          onPress={() =>
            setHoraVisible(false)
          }
        >

          <Pressable
            style={styles.modalCardChico}
            onPress={() => {}}
          >

            <Text style={styles.modalTitulo}>
              Ingresá la hora
            </Text>

            <TextInput
              style={styles.horaInput}
              value={horaTemp}
              onChangeText={handleHoraTextChange}
              placeholder="00:00"
              placeholderTextColor="#bbb"
              keyboardType="number-pad"
              maxLength={5}
              autoFocus
            />

            <Pressable
              style={styles.modalBoton}
              onPress={confirmarHora}
            >

              <Text style={styles.modalBotonTexto}>
                Confirmar
              </Text>

            </Pressable>

          </Pressable>

        </Pressable>

      </Modal>


      <Modal
        visible={dosisVisible}
        transparent
        animationType="fade"
      >

        <Pressable
          style={styles.overlay}
          onPress={() =>
            setDosisVisible(false)
          }
        >

          <Pressable
            style={styles.modalCardChico}
            onPress={() => {}}
          >

            <Text style={styles.modalTitulo}>
              Cantidad de comprimidos
            </Text>

            <View style={styles.stepperRow}>

              <Pressable
                style={styles.stepperBoton}
                onPress={() => {

                  const actual =
                    parseFloat(
                      dosisTemp.replace(',', '.')
                    ) || 0.5;

                  const n = Math.max(
                    0.5,
                    Math.round(
                      (actual - 0.5) * 2
                    ) / 2
                  );

                  setDosisTemp(
                    formatearDosis(n)
                  );
                }}
              >

                <Ionicons
                  name="remove"
                  size={22}
                  color={PRIMARY}
                />

              </Pressable>

              <TextInput
                style={styles.stepperInput}
                value={dosisTemp}
                onChangeText={(t) =>
                  setDosisTemp(
                    t.replace(
                      /[^0-9.,]/g,
                      ''
                    )
                  )
                }
                keyboardType="decimal-pad"
                textAlign="center"
              />

              <Pressable
                style={styles.stepperBoton}
                onPress={() => {

                  const actual =
                    parseFloat(
                      dosisTemp.replace(',', '.')
                    ) || 0;

                  const n =
                    Math.round(
                      (actual + 0.5) * 2
                    ) / 2;

                  setDosisTemp(
                    formatearDosis(n)
                  );
                }}
              >

                <Ionicons
                  name="add"
                  size={22}
                  color={PRIMARY}
                />

              </Pressable>

            </View>

            <Text style={styles.ayudaTexto}>
              Podés escribir medias dosis, ej: 0,5
            </Text>

            <Pressable
              style={styles.modalBoton}
              onPress={confirmarDosis}
            >

              <Text style={styles.modalBotonTexto}>
                Confirmar
              </Text>

            </Pressable>

          </Pressable>

        </Pressable>

      </Modal>

      {/* ========================= */}
      {/* MODAL LÍMITE DE DOSIS */}
      {/* ========================= */}

      <Modal
        visible={limiteVisible}
        transparent
        animationType="fade"
      >

        <Pressable
          style={styles.overlay}
          onPress={() =>
            setLimiteVisible(false)
          }
        >

          <Pressable
            style={styles.modalCardChico}
            onPress={() => {}}
          >

            <Text style={styles.modalTitulo}>
              Límite de comprimidos
            </Text>

            <View style={styles.stepperRow}>

              <Pressable
                style={styles.stepperBoton}
                onPress={() => {

                  const n = Math.max(
                    1,
                    (parseInt(limiteTemp, 10) || 1) - 1
                  );

                  setLimiteTemp(
                    String(n)
                  );
                }}
              >

                <Ionicons
                  name="remove"
                  size={22}
                  color={PRIMARY}
                />

              </Pressable>

              <TextInput
                style={styles.stepperInput}
                value={limiteTemp}
                onChangeText={(t) =>
                  setLimiteTemp(
                    t.replace(
                      /[^0-9]/g,
                      ''
                    )
                  )
                }
                keyboardType="number-pad"
                textAlign="center"
              />

              <Pressable
                style={styles.stepperBoton}
                onPress={() => {

                  const n =
                    (parseInt(
                      limiteTemp,
                      10
                    ) || 0) + 1;

                  setLimiteTemp(
                    String(n)
                  );
                }}
              >

                <Ionicons
                  name="add"
                  size={22}
                  color={PRIMARY}
                />

              </Pressable>

            </View>

            <Pressable
              style={styles.modalBoton}
              onPress={confirmarLimite}
            >

              <Text style={styles.modalBotonTexto}>
                Confirmar
              </Text>

            </Pressable>

          </Pressable>

        </Pressable>

      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 50,
  },

  backButton: {
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },

  illustration: {
    alignSelf: 'center',
    width: 140,
    height: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 10,
  },

  bellEmoji: {
    fontSize: 40,
  },

  phoneIcon: {
    width: 70,
    height: 100,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },

  screenBar: {
    width: 44,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#a8dadc',
  },

  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 28,
  },

  campos: {
    backgroundColor: '#f5f6f8',
    borderRadius: 14,
    paddingHorizontal: 18,
  },

  campoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },

  campoLabel: {
    fontSize: 16,
    color: '#222',
  },

  campoValorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  campoValor: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY,
  },

  separador: {
    height: 1,
    backgroundColor: '#e5e5e5',
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },

  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },

 

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
  },

  modalCardChico: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },

  modalTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
  },



  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  calendarTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },

  semanaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  diaSemanaTexto: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },

  diasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  diaCelda: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },

  diaCeldaActiva: {
    backgroundColor: PRIMARY,
    borderRadius: 100,
  },

  diaTexto: {
    fontSize: 14,
    color: '#333',
  },

  diaTextoActivo: {
    color: '#fff',
    fontWeight: '700',
  },

 

  horaInput: {
    fontSize: 32,
    fontWeight: '700',
    color: '#222',
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
    paddingVertical: 6,
    paddingHorizontal: 24,
    marginBottom: 20,
    textAlign: 'center',
  },

  // -----------------------------
  // STEPPER
  // -----------------------------

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },

  stepperBoton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eaf7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepperInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    minWidth: 60,
  },

  ayudaTexto: {
    fontSize: 12,
    color: '#999',
    marginTop: -10,
    marginBottom: 16,
  },

  modalBoton: {
    backgroundColor: PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },

  modalBotonTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

});
