import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import Text from '../../components/Texto';
import { useColores, useEstilos } from '../../context/ColorContext';

const GUARDADAS_KEY = '@noticias_guardadas';

// API de noticias (NewsData.io)
const API_KEY = process.env.EXPO_PUBLIC_NEWSDATA_KEY;
const API_URL = 'https://newsdata.io/api/1/latest';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos
const CACHE_PREFIX = '@news_cache_v2_'; // v2: descarta el caché de la versión anterior

const TAB_BAR_ITEMS = [
  { key: 'hoy', label: 'Home', icon: 'list-outline', route: '/home' },
  { key: 'progreso', label: 'Progreso', icon: 'stats-chart-outline', route: '/progreso' },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline', route: '/noticias' },
  { key: 'terapia', label: 'Terapia', icon: 'medkit-outline', route: '/terapia' },
];

const CATEGORIAS = ['Todas', 'Medicación', 'Enfermedades', 'Nutrición', 'Bienestar', 'Guardadas'];

// Colores propios de cada categoría (etiquetas). Se mantienen fijos a propósito.
const COLORES_CATEGORIA = {
  Medicación: ['#EAF7EB', '#2E7D32'],
  Enfermedades: ['#FDECEC', '#C62828'],
  Nutrición: ['#FFF4E0', '#E08A00'],
  Bienestar: ['#E8F1FD', '#1E6FD9'],
};

// Emoji que se usa cuando una noticia de la API no trae imagen
const EMOJI_CATEGORIA = {
  Medicación: '💊',
  Enfermedades: '🩺',
  Nutrición: '🥗',
  Bienestar: '🧘',
};

// Categorías de versiones anteriores (para no perder noticias ya guardadas)
const CATEGORIAS_VIEJAS = { Hábitos: 'Bienestar' };

// ───────────────────── Filtros de la API ─────────────────────
// Importante: el plan gratis limita el largo de la búsqueda (~100 caracteres),
// así que estas consultas están pensadas para ser cortas.

// Se agrega a todas las búsquedas para que el servidor descarte horóscopos
const EXCLUIR = ' NOT (horóscopo OR zodiaco)';

const QUERY_POR_CATEGORIA = {
  Todas: `(salud OR médico OR medicamento OR enfermedad OR tratamiento)${EXCLUIR}`,
  Medicación: `(medicamento OR fármaco OR tratamiento OR vacuna OR farmacia)${EXCLUIR}`,
  Enfermedades: `(diabetes OR hipertensión OR cáncer OR gripe OR dengue)${EXCLUIR}`,
  Nutrición: `(alimentación OR nutrición OR dieta OR vitaminas OR hidratación)${EXCLUIR}`,
  Bienestar: `("salud mental" OR sueño OR estrés OR ejercicio OR bienestar)${EXCLUIR}`,
};

// ───────────────────── Filtros locales ─────────────────────
// Segunda barrera: se aplica sobre lo que devuelve la API.
// Podés agregar o quitar palabras de estas dos listas.

// Si el título o el resumen coincide con esto, la noticia se descarta
const TEMAS_BLOQUEADOS =
  /hor[óo]scopo|zod[ií]aco|tarot|astrolog|numerolog|quiniela|loter[ií]a|f[úu]tbol|farándula|farandula|chimentos|show ?business/i;

// La noticia tiene que mencionar al menos un tema de salud
const TEMAS_DE_SALUD =
  /salud|m[ée]dic|f[áa]rmac|farmacia|enfermedad|tratamiento|vacun|s[íi]ntoma|diabetes|hipertens|c[áa]ncer|nutri|aliment|dieta|vitamina|sue[ñn]o|estr[ée]s|ansiedad|ejercicio|bienestar|hospital|paciente|terapia|dolor|virus|gripe|dengue|infecci|obesidad|colesterol|presi[óo]n arterial|prevenci[óo]n|cl[íi]nic|cirug|diagn[óo]stic/i;

// Para "Todas": se adivina la categoría de cada noticia según palabras clave
function clasificar(texto) {
  if (/medic|f[áa]rmac|farmacia|tratamiento|dosis|pastill|vacun|receta/i.test(texto)) {
    return 'Medicación';
  }
  if (
    /enfermedad|diabetes|hipertens|c[áa]ncer|gripe|dengue|virus|infecci|s[íi]ntoma|obesidad|colesterol|covid|brote|epidemia/i.test(
      texto
    )
  ) {
    return 'Enfermedades';
  }
  if (/aliment|nutri|dieta|vitamina|hidrat|comida/i.test(texto)) return 'Nutrición';
  return 'Bienestar';
}

// Artículos propios: se muestran solo si la API falla y no hay nada en caché
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
    categoria: 'Medicación',
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
    categoria: 'Nutrición',
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
    categoria: 'Bienestar',
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

// ───────────────────── Utilidades de la API ─────────────────────

function normalizar(a, categoria) {
  const cat =
    categoria === 'Todas' || categoria === 'Guardadas'
      ? clasificar(`${a.title} ${a.description}`)
      : categoria;
  return {
    id: String(a.article_id),
    categoria: cat,
    emoji: EMOJI_CATEGORIA[cat],
    titulo: a.title,
    resumen: a.description,
    contenido: [a.description],
    fuente: a.source_name || a.source_id || 'Fuente externa',
    fechaISO: a.pubDate || null,
    imagen: a.image_url || null,
    link: a.link || null,
  };
}

// Clave para detectar la misma noticia publicada por distintos medios
const claveTitulo = (t) =>
  String(t)
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü]/g, '')
    .slice(0, 60);

// Filtra temas ajenos y repetidas, y devuelve las noticias listas para mostrar.
// "existentes" son las que ya están en pantalla (para no repetirlas al cargar más).
function procesar(json, categoria, existentes = []) {
  const ids = new Set(existentes.map((n) => n.id));
  const claves = new Set(existentes.map((n) => claveTitulo(n.titulo)));
  const salida = [];

  for (const a of json.results || []) {
    if (!a.title || !a.description || a.duplicate) continue;

    const texto = `${a.title} ${a.description}`;
    if (TEMAS_BLOQUEADOS.test(texto)) continue;
    if (!TEMAS_DE_SALUD.test(texto)) continue;

    const id = String(a.article_id);
    const clave = claveTitulo(a.title);
    if (ids.has(id) || claves.has(clave)) continue;

    ids.add(id);
    claves.add(clave);
    salida.push(normalizar(a, categoria));
  }
  return salida;
}

// Pide una página de noticias, con caché en AsyncStorage para ahorrar créditos
async function pedirNoticias(categoria, page, forzar) {
  const cacheKey = `${CACHE_PREFIX}${categoria}_${page || 'p1'}`;

  if (!forzar) {
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (raw) {
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL) return data;
      }
    } catch (e) {}
  }

  if (!API_KEY) throw new Error('Falta EXPO_PUBLIC_NEWSDATA_KEY en el .env');

  const params = new URLSearchParams({
    apikey: API_KEY,
    category: 'health',
    language: 'es',
    qInMeta: QUERY_POR_CATEGORIA[categoria] || QUERY_POR_CATEGORIA.Todas,
  });
  if (page) params.set('page', page);

  const res = await fetch(`${API_URL}?${params.toString()}`);
  const data = await res.json();
  if (data.status === 'error') {
    throw new Error(data.results?.message || 'Error de la API de noticias');
  }

  AsyncStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data })).catch(() => {});
  return data;
}

// NewsData devuelve la fecha como "YYYY-MM-DD HH:mm:ss" en UTC
function tiempoRelativo(fecha) {
  if (!fecha) return '';
  const d = new Date(String(fecha).replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return '';
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const dias = Math.floor(h / 24);
  return dias === 1 ? 'Hace 1 día' : `Hace ${dias} días`;
}

const textoFecha = (n) => (n.fechaISO ? tiempoRelativo(n.fechaISO) : n.fecha || '');

// Artículos propios muestran "X min"; los de la API muestran la fuente
const textoMeta = (n, largo = false) =>
  n.lectura ? (largo ? `${n.lectura} min de lectura` : `${n.lectura} min`) : n.fuente;

// ───────────────────────── Componentes ─────────────────────────

function EtiquetaCategoria({ categoria }) {
  const styles = useEstilos(crearEstilos);
  const [fondo, color] = COLORES_CATEGORIA[categoria] || ['#EEE', '#555'];
  return (
    <View style={[styles.tag, { backgroundColor: fondo }]}>
      <Text style={[styles.tagText, { color }]}>{categoria}</Text>
    </View>
  );
}

function NoticiaDestacada({ noticia, guardada, onPress, onToggleGuardada }) {
  const { primario } = useColores();
  const styles = useEstilos(crearEstilos);
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.featured} onPress={onPress}>
      <View style={styles.featuredTop}>
        <View style={styles.featuredBadge}>
          <Ionicons name="sparkles" size={12} color={primario} />
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
      <Text style={styles.featuredTitle} numberOfLines={4}>
        {noticia.titulo}
      </Text>
      <Text style={styles.featuredResumen} numberOfLines={2}>
        {noticia.resumen}
      </Text>

      <View style={styles.featuredMeta}>
        <Ionicons name="time-outline" size={14} color="#E8F5E9" />
        <Text style={styles.featuredMetaText} numberOfLines={1}>
          {textoMeta(noticia, true)}
        </Text>
        <Text style={styles.featuredMetaDot}>•</Text>
        <Text style={styles.featuredMetaText} numberOfLines={1}>
          {textoFecha(noticia)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function NoticiaCard({ noticia, guardada, onPress, onToggleGuardada }) {
  const { primario, textoSuave } = useColores();
  const styles = useEstilos(crearEstilos);
  const [fondo] = COLORES_CATEGORIA[noticia.categoria] || ['#EEE'];
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onPress}>
      <View style={[styles.cardEmojiBox, { backgroundColor: fondo }]}>
        {noticia.imagen ? (
          <Image source={{ uri: noticia.imagen }} style={styles.cardThumb} resizeMode="cover" />
        ) : (
          <Text style={styles.cardEmoji}>{noticia.emoji}</Text>
        )}
      </View>

      <View style={styles.cardBody}>
        <EtiquetaCategoria categoria={noticia.categoria} />
        <Text style={styles.cardTitle} numberOfLines={2}>
          {noticia.titulo}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={13} color={textoSuave} />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {textoMeta(noticia)}
          </Text>
          <Text style={styles.cardMetaDot}>•</Text>
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {textoFecha(noticia)}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={onToggleGuardada} hitSlop={10} style={styles.cardBookmark}>
        <Ionicons
          name={guardada ? 'bookmark' : 'bookmark-outline'}
          size={20}
          color={guardada ? primario : textoSuave}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ───────────────────────── Pantalla ─────────────────────────

export default function NoticiasScreen() {
  const { primario, texto, textoSuave } = useColores();
  const styles = useEstilos(crearEstilos);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [categoria, setCategoria] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [guardadas, setGuardadas] = useState([]); // objetos completos
  const [abierta, setAbierta] = useState(null);

  const [noticias, setNoticias] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const forzarRef = useRef(false);

  // Cargar guardadas (convierte formatos viejos: ids sueltos y categoría "Hábitos")
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const datos = await AsyncStorage.getItem(GUARDADAS_KEY);
          const lista = datos ? JSON.parse(datos) : [];
          const migradas = (Array.isArray(lista) ? lista : [])
            .map((g) => (typeof g === 'string' ? NOTICIAS.find((n) => n.id === g) : g))
            .filter((g) => g && typeof g === 'object')
            .map((g) => ({ ...g, categoria: CATEGORIAS_VIEJAS[g.categoria] || g.categoria }));
          setGuardadas(migradas);
        } catch (e) {
          console.log('Error cargando noticias guardadas:', e);
        }
      })();
    }, [])
  );

  // Cargar noticias de la API al cambiar de categoría o al refrescar
  useEffect(() => {
    if (categoria === 'Guardadas') return;
    let cancelado = false;
    const forzar = forzarRef.current;
    forzarRef.current = false;

    if (!forzar) {
      setNoticias([]);
      setNextPage(null);
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const json = await pedirNoticias(categoria, null, forzar);
        if (cancelado) return;
        setNoticias(procesar(json, categoria));
        setNextPage(json.nextPage || null);
      } catch (e) {
        if (!cancelado) {
          console.log('Error cargando noticias:', e);
          setError('No se pudieron cargar las noticias nuevas.');
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [categoria, refreshKey]);

  const onRefresh = () => {
    if (categoria === 'Guardadas') return;
    forzarRef.current = true;
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
  };

  const cargarMas = async () => {
    if (!nextPage || loadingMore) return;
    setLoadingMore(true);
    try {
      const json = await pedirNoticias(categoria, nextPage, false);
      const nuevas = procesar(json, categoria, noticias);
      setNoticias((prev) => [...prev, ...nuevas]);
      setNextPage(json.nextPage || null);
    } catch (e) {
      console.log('Error cargando más noticias:', e);
    } finally {
      setLoadingMore(false);
    }
  };

  // Guardar / quitar (se guarda la noticia completa, porque las de la API cambian)
  const idsGuardadas = useMemo(() => new Set(guardadas.map((g) => g.id)), [guardadas]);

  const toggleGuardada = async (noticia) => {
    const nueva = idsGuardadas.has(noticia.id)
      ? guardadas.filter((g) => g.id !== noticia.id)
      : [noticia, ...guardadas];

    setGuardadas(nueva);

    try {
      await AsyncStorage.setItem(GUARDADAS_KEY, JSON.stringify(nueva));
    } catch (e) {
      console.log('Error guardando noticia:', e);
    }
  };

  const usandoRespaldo = categoria !== 'Guardadas' && !!error && noticias.length === 0;

  const filtradas = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();
    const base =
      categoria === 'Guardadas' ? guardadas : usandoRespaldo ? NOTICIAS : noticias;

    return base.filter((n) => {
      if (categoria !== 'Todas' && categoria !== 'Guardadas' && n.categoria !== categoria) {
        return false;
      }
      if (textoBusqueda) {
        return (
          n.titulo.toLowerCase().includes(textoBusqueda) ||
          (n.resumen || '').toLowerCase().includes(textoBusqueda)
        );
      }
      return true;
    });
  }, [categoria, busqueda, guardadas, noticias, usandoRespaldo]);

  const mostrarDestacada = !busqueda.trim() && categoria !== 'Guardadas' && filtradas.length > 0;
  const destacada = mostrarDestacada ? filtradas[0] : null;
  const resto = mostrarDestacada ? filtradas.slice(1) : filtradas;

  const cargandoInicial = loading && categoria !== 'Guardadas' && noticias.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Noticias</Text>
          <Text style={styles.headerSubtitle}>Artículos de salud pensados para vos</Text>

          {/* BUSCADOR */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={textoSuave} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar artículos"
              placeholderTextColor={textoSuave}
              value={busqueda}
              onChangeText={setBusqueda}
              returnKeyType="search"
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={textoSuave} />
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
                      color={activa ? '#FFFFFF' : primario}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text style={[styles.chipText, activa && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* LISTA */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 30 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={primario}
              colors={[primario]}
            />
          }
        >
          {usandoRespaldo && (
            <View style={styles.errorBox}>
              <Ionicons name="cloud-offline-outline" size={18} color="#B26A00" />
              <Text style={styles.errorText}>
                {error} Mostrando artículos de SecureMedicine. Deslizá hacia abajo para reintentar.
              </Text>
            </View>
          )}

          {cargandoInicial ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator color={primario} size="large" />
              <Text style={[styles.emptyText, { marginTop: 14 }]}>Buscando noticias…</Text>
            </View>
          ) : filtradas.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={categoria === 'Guardadas' ? 'bookmark-outline' : 'search-outline'}
                  size={30}
                  color={primario}
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
              {categoria !== 'Guardadas' && !busqueda && nextPage && (
                <TouchableOpacity
                  style={[styles.loadMore, { alignSelf: 'stretch', marginTop: 16 }]}
                  onPress={cargarMas}
                  disabled={loadingMore}
                  activeOpacity={0.8}
                >
                  {loadingMore ? (
                    <ActivityIndicator color={primario} />
                  ) : (
                    <Text style={styles.loadMoreText}>Buscar más noticias</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {destacada && (
                <NoticiaDestacada
                  noticia={destacada}
                  guardada={idsGuardadas.has(destacada.id)}
                  onPress={() => setAbierta(destacada)}
                  onToggleGuardada={() => toggleGuardada(destacada)}
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
                  guardada={idsGuardadas.has(n.id)}
                  onPress={() => setAbierta(n)}
                  onToggleGuardada={() => toggleGuardada(n)}
                />
              ))}

              {categoria !== 'Guardadas' && !usandoRespaldo && nextPage && (
                <TouchableOpacity
                  style={styles.loadMore}
                  onPress={cargarMas}
                  disabled={loadingMore}
                  activeOpacity={0.8}
                >
                  {loadingMore ? (
                    <ActivityIndicator color={primario} />
                  ) : (
                    <Text style={styles.loadMoreText}>Ver más noticias</Text>
                  )}
                </TouchableOpacity>
              )}

              <Text style={styles.disclaimer}>
                Contenido informativo. No reemplaza la consulta con un profesional de la salud.
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
                <Ionicons name={item.icon} size={22} color={activo ? primario : textoSuave} />
                <Text style={[styles.tabLabel, activo && styles.tabLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* DETALLE */}
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
                <Ionicons name="arrow-back" size={22} color={texto} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailIconButton}
                onPress={() => toggleGuardada(abierta)}
                hitSlop={10}
              >
                <Ionicons
                  name={idsGuardadas.has(abierta.id) ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={idsGuardadas.has(abierta.id) ? primario : texto}
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
                {abierta.imagen ? (
                  <Image
                    source={{ uri: abierta.imagen }}
                    style={styles.detailHeroImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.detailEmoji}>{abierta.emoji}</Text>
                )}
              </View>

              <EtiquetaCategoria categoria={abierta.categoria} />

              <Text style={styles.detailTitle}>{abierta.titulo}</Text>

              <View style={styles.cardMeta}>
                <Ionicons name="time-outline" size={14} color={textoSuave} />
                <Text style={styles.cardMetaText} numberOfLines={1}>
                  {textoMeta(abierta, true)}
                </Text>
                <Text style={styles.cardMetaDot}>•</Text>
                <Text style={styles.cardMetaText} numberOfLines={1}>
                  {textoFecha(abierta)}
                </Text>
              </View>

              <View style={styles.detailDivider} />

              {abierta.contenido.map((parrafo, i) => (
                <Text key={i} style={styles.detailParagraph}>
                  {parrafo}
                </Text>
              ))}

              {abierta.link ? (
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => Linking.openURL(abierta.link).catch(() => {})}
                  activeOpacity={0.85}
                >
                  <Text style={styles.detailButtonText}>Leer nota completa</Text>
                  <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              ) : null}

              <View style={styles.detailNote}>
                <Ionicons name="information-circle-outline" size={20} color={primario} />
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

const crearEstilos = ({
  primario,
  primarioSuave,
  fondo,
  tarjeta,
  texto,
  textoMedio,
  textoSuave,
  borde,
  fondoSecundario,
}) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: fondo },
    container: { flex: 1, backgroundColor: fondo },

    header: {
      backgroundColor: tarjeta,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 14,
    },
    headerTitle: { color: texto, fontSize: 26, fontWeight: '600' },
    headerSubtitle: { color: textoSuave, fontSize: 14, marginTop: 4, marginBottom: 14 },

    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: fondoSecundario,
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 46,
      gap: 8,
    },
    searchInput: { flex: 1, fontSize: 15, color: texto, paddingVertical: 0 },

    chipsWrapper: {
      backgroundColor: tarjeta,
      borderBottomWidth: 1,
      borderBottomColor: borde,
    },
    chips: { paddingHorizontal: 20, paddingBottom: 14, gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: fondoSecundario,
    },
    chipActive: { backgroundColor: primario },
    chipText: { color: textoMedio, fontSize: 14, fontWeight: '600' },
    chipTextActive: { color: '#FFFFFF' },

    scrollView: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 20 },

    sectionTitle: {
      color: texto,
      fontSize: 18,
      fontWeight: '700',
      marginTop: 8,
      marginBottom: 14,
    },

    // Aviso cuando falla la API
    errorBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: '#FFF4E0',
      borderRadius: 14,
      padding: 12,
      marginBottom: 16,
    },
    errorText: { flex: 1, color: '#8A5600', fontSize: 13, lineHeight: 18 },

    // Destacada
    featured: {
      backgroundColor: primario,
      borderRadius: 22,
      padding: 20,
      marginBottom: 18,
      elevation: 4,
      shadowColor: primario,
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
    featuredBadgeText: { color: primario, fontSize: 12, fontWeight: '700' },
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
    featuredMetaText: { color: '#E8F5E9', fontSize: 13, flexShrink: 1 },
    featuredMetaDot: { color: '#E8F5E9', fontSize: 13 },

    // Tarjetas
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tarjeta,
      borderRadius: 18,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: borde,
      elevation: 2,
    },
    cardEmojiBox: {
      width: 64,
      height: 64,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
      overflow: 'hidden',
    },
    cardEmoji: { fontSize: 30 },
    cardThumb: { width: 64, height: 64 },
    cardBody: { flex: 1 },
    cardTitle: {
      color: texto,
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 20,
      marginTop: 6,
    },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
    cardMetaText: { color: textoSuave, fontSize: 12, flexShrink: 1 },
    cardMetaDot: { color: textoSuave, fontSize: 12 },
    cardBookmark: { paddingLeft: 10, alignSelf: 'flex-start', paddingTop: 2 },

    tag: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
    },
    tagText: { fontSize: 11, fontWeight: '700' },

    loadMore: {
      height: 48,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: primario,
      backgroundColor: tarjeta,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 6,
    },
    loadMoreText: { color: primario, fontSize: 15, fontWeight: '700' },

    disclaimer: {
      color: textoSuave,
      fontSize: 12,
      lineHeight: 17,
      textAlign: 'center',
      marginTop: 16,
      paddingHorizontal: 10,
    },

    // Estado vacío
    emptyCard: {
      backgroundColor: tarjeta,
      borderRadius: 18,
      padding: 28,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: borde,
    },
    emptyIcon: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: primarioSuave,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
    },
    emptyTitle: { color: texto, fontSize: 17, fontWeight: '700', textAlign: 'center' },
    emptyText: {
      color: textoSuave,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginTop: 6,
    },

    // Detalle
    detailSafe: { flex: 1, backgroundColor: tarjeta },
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
      backgroundColor: fondoSecundario,
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
      overflow: 'hidden',
    },
    detailHeroImage: { width: '100%', height: '100%' },
    detailEmoji: { fontSize: 72 },
    detailTitle: {
      color: texto,
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 31,
      marginTop: 12,
    },
    detailDivider: { height: 1, backgroundColor: borde, marginVertical: 18 },
    detailParagraph: { color: texto, fontSize: 16, lineHeight: 25, marginBottom: 16 },
    detailButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      backgroundColor: primario,
      borderRadius: 14,
      height: 50,
      marginBottom: 16,
    },
    detailButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    detailNote: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: primarioSuave,
      borderRadius: 14,
      padding: 14,
      marginTop: 6,
    },
    detailNoteText: { flex: 1, color: texto, fontSize: 13, lineHeight: 19 },

    // Tab bar
    tabBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '100%',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: borde,
      backgroundColor: tarjeta,
    },
    tabItem: { flex: 1, alignItems: 'center', gap: 4 },
    tabLabel: { fontSize: 12, color: textoSuave },
    tabLabelActive: { color: primario, fontWeight: '600' },
  });