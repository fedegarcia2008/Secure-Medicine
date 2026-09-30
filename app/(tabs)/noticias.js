import React, { useCallback, useMemo, useState } from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal,} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';

const PRIMARY = '#4caf50';
const GUARDADAS_KEY = '@noticias_guardadas';

const TAB_BAR_ITEMS = [
  { key: 'hoy', label: 'Home', icon: 'list-outline', route: '/Home' },
  { key: 'progreso', label: 'Progreso', icon: 'stats-chart-outline', route: '/progreso' },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline', route: '/noticias' },
  { key: 'terapia', label: 'Terapia', icon: 'medkit-outline', route: '/terapia' },
];

const CATEGORIAS = ['Todas', 'Medicación', 'Hábitos', 'Bienestar', 'Guardadas'];


const COLORES_CATEGORIA = {
  Medicación: ['#EAF7EB', '#2E7D32'],
  Hábitos: ['#FFF4E0', '#E08A00'],
  Bienestar: ['#E8F1FD', '#1E6FD9'],
};


const NOTICIAS = [
  {
    id: '1',
    categoria: 'Medicación',
    emoji: '⏰',
    titulo: 'Por qué es importante tomar tu medicación a horario',
    resumen:
      'Mantener los horarios ayuda a que el nivel del medicamento en el cuerpo sea más estable.',
    lectura: 3,
    fecha: 'Hoy',
    contenido: [
      'Muchos tratamientos están pensados para que el medicamento se mantenga en un nivel estable en el cuerpo. Por eso, respetar los horarios indicados por tu médico es tan importante como tomar la dosis correcta.',
      'Cuando te salteás una toma o la tomás a destiempo, ese nivel puede subir o bajar más de lo previsto, y el tratamiento puede perder efectividad.',
      'Si te olvidaste una toma, no dupliques la dosis por tu cuenta. Consultá con tu médico o farmacéutico qué hacer en tu caso, porque la indicación cambia según el medicamento.',
      'Activar los recordatorios de la app es una buena forma de crear el hábito y no depender de la memoria.',
    ],
  },
  {
    id: '2',
    categoria: 'Hábitos',
    emoji: '🧠',
    titulo: 'Cómo armar una rutina para no olvidarte de tus pastillas',
    resumen: 'Asociar la toma con algo que ya hacés todos los días puede marcar la diferencia.',
    lectura: 4,
    fecha: 'Ayer',
    contenido: [
      'Una de las estrategias más efectivas es asociar la toma del medicamento con una actividad que ya forma parte de tu día: el desayuno, cepillarte los dientes o preparar el mate.',
      'También ayuda dejar el medicamento en un lugar visible, siempre el mismo, lejos de la humedad y del calor.',
      'Un pastillero semanal te permite ver de un vistazo si ya tomaste la dosis de hoy y te ayuda a organizar la semana en un solo momento.',
      'Y si seguís con dudas, pedile a un familiar que te acompañe durante las primeras semanas, hasta que la rutina se vuelva automática.',
    ],
  },
  {
    id: '3',
    categoria: 'Bienestar',
    emoji: '💧',
    titulo: 'Hidratación: pequeños hábitos para tomar más agua',
    resumen: 'Tomar agua durante el día es simple, pero a veces cuesta recordarlo.',
    lectura: 2,
    fecha: 'Hace 2 días',
    contenido: [
      'El agua participa en casi todas las funciones del cuerpo. Mantenerte hidratado ayuda a la concentración, la digestión y el bienestar general.',
      'Llevá una botella con vos, tomá un vaso al despertarte y otro antes de cada comida. Son gestos chicos que suman a lo largo del día.',
      'Las necesidades cambian según la edad, el clima, la actividad física y las condiciones de salud. Si tenés alguna indicación médica específica sobre líquidos, seguí esa recomendación.',
    ],
  },
  {
    id: '4',
    categoria: 'Medicación',
    emoji: '🏠',
    titulo: 'Cómo guardar tus medicamentos de forma correcta',
    resumen: 'Dónde y cómo los guardás puede afectar su conservación.',
    lectura: 3,
    fecha: 'Hace 3 días',
    contenido: [
      'La mayoría de los medicamentos se conservan mejor en un lugar fresco, seco y alejado de la luz directa. El baño y la cocina suelen ser lugares poco recomendables por la humedad y los cambios de temperatura.',
      'Guardalos en su envase original, con el prospecto, para poder consultar la información y la fecha de vencimiento cuando lo necesites.',
      'Mantenelos fuera del alcance de los niños y revisá periódicamente los vencimientos. Los medicamentos vencidos no deben tomarse: consultá en tu farmacia cómo descartarlos.',
    ],
  },
  {
    id: '5',
    categoria: 'Bienestar',
    emoji: '😴',
    titulo: 'Dormir bien: hábitos para un mejor descanso',
    resumen: 'Horarios regulares y un ambiente tranquilo ayudan a descansar mejor.',
    lectura: 4,
    fecha: 'Hace 4 días',
    contenido: [
      'Dormir bien influye en el ánimo, la energía y la salud en general. Intentar acostarte y levantarte a horarios parecidos todos los días ayuda a que el cuerpo regule su reloj interno.',
      'Reducí el uso de pantallas en la hora previa a dormir, evitá las comidas muy pesadas por la noche y procurá que tu habitación esté oscura y silenciosa.',
      'Si tenés problemas de sueño que se repiten, conviene consultarlo con un profesional de la salud.',
    ],
  },
  {
    id: '6',
    categoria: 'Hábitos',
    emoji: '🚶',
    titulo: 'Caminar un poco cada día: por dónde empezar',
    resumen: 'No hace falta un gran esfuerzo: empezar de a poco es suficiente.',
    lectura: 3,
    fecha: 'Hace 5 días',
    contenido: [
      'La actividad física regular es uno de los hábitos que más aportan a la salud. Y no hace falta empezar con algo intenso: una caminata diaria es un gran comienzo.',
      'Empezá con 10 o 15 minutos y aumentá de a poco según cómo te sientas. Elegí un horario que puedas sostener y, si podés, acompañate de alguien.',
      'Antes de empezar una rutina nueva, sobre todo si tenés alguna condición de salud, consultá con tu médico.',
    ],
  },
  {
    id: '7',
    categoria: 'Medicación',
    emoji: '🍽️',
    titulo: 'Medicamentos y comidas: lo que conviene consultar',
    resumen: 'Algunos se toman con comida y otros en ayunas. Mirá siempre la indicación.',
    lectura: 3,
    fecha: 'Hace 1 semana',
    contenido: [
      'Algunos medicamentos se absorben mejor con el estómago vacío y otros deben tomarse junto con las comidas para evitar molestias. No hay una regla general: depende de cada uno.',
      'Leé el prospecto y consultá a tu médico o farmacéutico si tenés dudas sobre cómo tomar cada medicamento.',
      'También es bueno preguntar si hay alimentos, bebidas o suplementos que conviene evitar mientras dure tu tratamiento.',
    ],
  },
];



function EtiquetaCategoria({ categoria }) {
  const [fondo, color] = COLORES_CATEGORIA[categoria] || ['#EEE', '#555'];
  return (
    <View style={[styles.tag, { backgroundColor: fondo }]}>
      <Text style={[styles.tagText, { color }]}>{categoria}</Text>
    </View>
  );
}

function NoticiaDestacada({ noticia, guardada, onPress, onToggleGuardada }) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.featured} onPress={onPress}>
      <View style={styles.featuredTop}>
        <View style={styles.featuredBadge}>
          <Ionicons name="sparkles" size={12} color={PRIMARY} />
          <Text style={styles.featuredBadgeText}>Destacada</Text>
        </View>
        <TouchableOpacity onPress={onToggleGuardada} hitSlop={10}>
          <Ionicons
            name={guardada ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.featuredEmoji}>{noticia.emoji}</Text>
      <Text style={styles.featuredTitle}>{noticia.titulo}</Text>
      <Text style={styles.featuredResumen} numberOfLines={2}>
        {noticia.resumen}
      </Text>

      <View style={styles.featuredMeta}>
        <Ionicons name="time-outline" size={14} color="#E8F5E9" />
        <Text style={styles.featuredMetaText}>{noticia.lectura} min de lectura</Text>
        <Text style={styles.featuredMetaDot}>•</Text>
        <Text style={styles.featuredMetaText}>{noticia.fecha}</Text>
      </View>
    </TouchableOpacity>
  );
}

function NoticiaCard({ noticia, guardada, onPress, onToggleGuardada }) {
  const [fondo] = COLORES_CATEGORIA[noticia.categoria] || ['#EEE'];
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onPress}>
      <View style={[styles.cardEmojiBox, { backgroundColor: fondo }]}>
        <Text style={styles.cardEmoji}>{noticia.emoji}</Text>
      </View>

      <View style={styles.cardBody}>
        <EtiquetaCategoria categoria={noticia.categoria} />
        <Text style={styles.cardTitle} numberOfLines={2}>
          {noticia.titulo}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={13} color="#8A949B" />
          <Text style={styles.cardMetaText}>{noticia.lectura} min</Text>
          <Text style={styles.cardMetaDot}>•</Text>
          <Text style={styles.cardMetaText}>{noticia.fecha}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={onToggleGuardada} hitSlop={10} style={styles.cardBookmark}>
        <Ionicons
          name={guardada ? 'bookmark' : 'bookmark-outline'}
          size={20}
          color={guardada ? PRIMARY : '#B0B7BC'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}



// PANTALLA


export default function NoticiasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [categoria, setCategoria] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [guardadas, setGuardadas] = useState([]);
  const [abierta, setAbierta] = useState(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const datos = await AsyncStorage.getItem(GUARDADAS_KEY);
          const lista = datos ? JSON.parse(datos) : [];
          setGuardadas(Array.isArray(lista) ? lista : []);
        } catch (e) {
          console.log('Error cargando noticias guardadas:', e);
        }
      })();
    }, [])
  );

  const toggleGuardada = async (id) => {
    const nueva = guardadas.includes(id)
      ? guardadas.filter((g) => g !== id)
      : [...guardadas, id];

    setGuardadas(nueva);

    try {
      await AsyncStorage.setItem(GUARDADAS_KEY, JSON.stringify(nueva));
    } catch (e) {
      console.log('Error guardando noticia:', e);
    }
  };

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return NOTICIAS.filter((n) => {
      if (categoria === 'Guardadas' && !guardadas.includes(n.id)) return false;
      if (categoria !== 'Todas' && categoria !== 'Guardadas' && n.categoria !== categoria) {
        return false;
      }
      if (texto) {
        return (
          n.titulo.toLowerCase().includes(texto) ||
          n.resumen.toLowerCase().includes(texto)
        );
      }
      return true;
    });
  }, [categoria, busqueda, guardadas]);

  const mostrarDestacada = !busqueda.trim() && categoria !== 'Guardadas' && filtradas.length > 0;
  const destacada = mostrarDestacada ? filtradas[0] : null;
  const resto = mostrarDestacada ? filtradas.slice(1) : filtradas;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Noticias</Text>
          <Text style={styles.headerSubtitle}>Artículos de salud pensados para vos</Text>

          {/* BUSCADOR */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#8A949B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar artículos"
              placeholderTextColor="#A0A8AE"
              value={busqueda}
              onChangeText={setBusqueda}
              returnKeyType="search"
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color="#B0B7BC" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* CATEGORÍAS */}
        <View style={styles.chipsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {CATEGORIAS.map((cat) => {
              const activa = cat === categoria;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, activa && styles.chipActive]}
                  onPress={() => setCategoria(cat)}
                  activeOpacity={0.8}
                >
                  {cat === 'Guardadas' && (
                    <Ionicons
                      name="bookmark"
                      size={13}
                      color={activa ? '#FFFFFF' : PRIMARY}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text style={[styles.chipText, activa && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 30 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtradas.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={categoria === 'Guardadas' ? 'bookmark-outline' : 'search-outline'}
                  size={30}
                  color={PRIMARY}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {categoria === 'Guardadas' ? 'Todavía no guardaste nada' : 'Sin resultados'}
              </Text>
              <Text style={styles.emptyText}>
                {categoria === 'Guardadas'
                  ? 'Tocá el ícono del marcador en un artículo para guardarlo y leerlo después.'
                  : 'Probá con otra palabra o elegí otra categoría.'}
              </Text>
            </View>
          ) : (
            <>
              {destacada && (
                <NoticiaDestacada
                  noticia={destacada}
                  guardada={guardadas.includes(destacada.id)}
                  onPress={() => setAbierta(destacada)}
                  onToggleGuardada={() => toggleGuardada(destacada.id)}
                />
              )}

              {resto.length > 0 && (
                <Text style={styles.sectionTitle}>
                  {mostrarDestacada ? 'Más artículos' : 'Resultados'}
                </Text>
              )}

              {resto.map((n) => (
                <NoticiaCard
                  key={n.id}
                  noticia={n}
                  guardada={guardadas.includes(n.id)}
                  onPress={() => setAbierta(n)}
                  onToggleGuardada={() => toggleGuardada(n.id)}
                />
              ))}

              <Text style={styles.disclaimer}>
              Noticias Importantes
              </Text>
            </>
          )}
        </ScrollView>

        {/* TAB BAR */}
        <View style={[styles.tabBar, { paddingBottom: 12 + insets.bottom }]}>
          {TAB_BAR_ITEMS.map((item) => {
            const activo = item.key === 'noticias';
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.tabItem}
                onPress={() => router.replace(item.route)}
              >
                <Ionicons name={item.icon} size={22} color={activo ? PRIMARY : '#6C757D'} />
                <Text style={[styles.tabLabel, activo && styles.tabLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      
      <Modal
        visible={!!abierta}
        animationType="slide"
        onRequestClose={() => setAbierta(null)}
      >
        {abierta && (
          <SafeAreaView style={styles.detailSafe} edges={['top', 'left', 'right']}>
            <View style={styles.detailHeader}>
              <TouchableOpacity
                style={styles.detailIconButton}
                onPress={() => setAbierta(null)}
                hitSlop={10}
              >
                <Ionicons name="arrow-back" size={22} color="#333" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailIconButton}
                onPress={() => toggleGuardada(abierta.id)}
                hitSlop={10}
              >
                <Ionicons
                  name={guardadas.includes(abierta.id) ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={guardadas.includes(abierta.id) ? PRIMARY : '#333'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={[styles.detailContent, { paddingBottom: 40 + insets.bottom }]}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.detailHero,
                  { backgroundColor: (COLORES_CATEGORIA[abierta.categoria] || ['#EEE'])[0] },
                ]}
              >
                <Text style={styles.detailEmoji}>{abierta.emoji}</Text>
              </View>

              <EtiquetaCategoria categoria={abierta.categoria} />

              <Text style={styles.detailTitle}>{abierta.titulo}</Text>

              <View style={styles.cardMeta}>
                <Ionicons name="time-outline" size={14} color="#8A949B" />
                <Text style={styles.cardMetaText}>{abierta.lectura} min de lectura</Text>
                <Text style={styles.cardMetaDot}>•</Text>
                <Text style={styles.cardMetaText}>{abierta.fecha}</Text>
              </View>

              <View style={styles.detailDivider} />

              {abierta.contenido.map((parrafo, i) => (
                <Text key={i} style={styles.detailParagraph}>
                  {parrafo}
                </Text>
              ))}

              <View style={styles.detailNote}>
                <Ionicons name="information-circle-outline" size={20} color={PRIMARY} />
                <Text style={styles.detailNoteText}>
                  Ante cualquier duda sobre tu salud o tu tratamiento, consultá con tu médico o
                  farmacéutico.
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}


// ESTILOS


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { flex: 1, backgroundColor: '#F8F9FA' },

 
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerTitle: { color: '#1A1D1E', fontSize: 26, fontWeight: '600' },
  headerSubtitle: { color: '#6C757D', fontSize: 14, marginTop: 4, marginBottom: 14 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1D1E', paddingVertical: 0 },

  
  chipsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
  },
  chips: { paddingHorizontal: 20, paddingBottom: 14, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
  },
  chipActive: { backgroundColor: PRIMARY },
  chipText: { color: '#4A5359', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },

  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  sectionTitle: {
    color: '#1A1D1E',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 14,
  },

 
  featured: {
    backgroundColor: PRIMARY,
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    elevation: 4,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadgeText: { color: PRIMARY, fontSize: 12, fontWeight: '700' },
  featuredEmoji: { fontSize: 44, marginTop: 14 },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 27,
    marginTop: 10,
  },
  featuredResumen: { color: '#E8F5E9', fontSize: 14, lineHeight: 20, marginTop: 8 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  featuredMetaText: { color: '#E8F5E9', fontSize: 13 },
  featuredMetaDot: { color: '#E8F5E9', fontSize: 13 },

  
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    elevation: 1,
  },
  cardEmojiBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardEmoji: { fontSize: 30 },
  cardBody: { flex: 1 },
  cardTitle: {
    color: '#1A1D1E',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  cardMetaText: { color: '#8A949B', fontSize: 12 },
  cardMetaDot: { color: '#B0B7BC', fontSize: 12 },
  cardBookmark: { paddingLeft: 10, alignSelf: 'flex-start', paddingTop: 2 },

  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: { fontSize: 11, fontWeight: '700' },

  disclaimer: {
    color: '#8A949B',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 10,
  },

  // Estado vacío
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#EAF7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: { color: '#1A1D1E', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyText: {
    color: '#6C757D',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },

  // Detalle
  detailSafe: { flex: 1, backgroundColor: '#FFFFFF' },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  detailIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: { paddingHorizontal: 20, paddingTop: 6 },
  detailHero: {
    height: 160,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  detailEmoji: { fontSize: 72 },
  detailTitle: {
    color: '#1A1D1E',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 31,
    marginTop: 12,
  },
  detailDivider: { height: 1, backgroundColor: '#E5E8EB', marginVertical: 18 },
  detailParagraph: { color: '#33393D', fontSize: 16, lineHeight: 25, marginBottom: 16 },
  detailNote: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EAF7EB',
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
  },
  detailNoteText: { flex: 1, color: '#2E5E31', fontSize: 13, lineHeight: 19 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E8EB',
    backgroundColor: '#FFFFFF',
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabLabel: { fontSize: 12, color: '#6C757D' },
  tabLabelActive: { color: PRIMARY, fontWeight: '600' },
});
