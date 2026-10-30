import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './Supabase';

const PREFIJO = '@progreso_';

export function fechaHoyString() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}

// Devuelve cuántos comprimidos se consumieron ANTES de fechaStr
// y cuántos incluyendo fechaStr.
export async function obtenerConsumo(med, fechaStr) {
  const dosisPorToma = Number(med.dosis) || 1;
  let antes = 0;
  let incluyendoDia = 0;

  const allKeys = await AsyncStorage.getAllKeys();
  const progresoKeys = allKeys.filter((k) => k.startsWith(PREFIJO));
  if (progresoKeys.length === 0) return { antes, incluyendoDia };

  const stores = await AsyncStorage.multiGet(progresoKeys);

  stores.forEach(([key, value]) => {
    if (!value) return;

    const fechaKey = key.slice(PREFIJO.length); // 'YYYY-MM-DD'
    if (fechaKey > fechaStr) return; // días posteriores: ignorar

    try {
      const data = JSON.parse(value);
      const tomas = Object.keys(data).filter(
        (k) => k.startsWith(`${med.id}_`) && data[k] === true
      ).length;

      const consumo = tomas * dosisPorToma;
      incluyendoDia += consumo;
      if (fechaKey < fechaStr) antes += consumo;
    } catch (e) {}
  });

  return { antes, incluyendoDia };
}

// true = el tratamiento ya terminó para ese día (no mostrar)
export async function verificarYLimitarMedicamento(med, fechaStr) {
  try {
    if (!med.id) return false;

    const limite = Number(med.limite_dosis) || 30;
    const { antes } = await obtenerConsumo(med, fechaStr);

    if (antes >= limite) {
      // Solo se desactiva en la base cuando se evalúa HOY,
      // para que mirar un día futuro en el calendario no lo desactive.
      if (fechaStr === fechaHoyString()) {
        const { error } = await supabase
          .from('medicamentos')
          .update({ en_tratamiento: false })
          .eq('id', med.id);

        if (error) console.log('Error actualizando en_tratamiento:', error.message);
      }
      return true;
    }
  } catch (error) {
    console.log('Error verificando límite de dosis:', error);
  }
  return false;
}