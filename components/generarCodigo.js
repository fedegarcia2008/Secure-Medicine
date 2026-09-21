// Genera un código aleatorio, fácil de leer y de escribir a mano
// (sin caracteres que se confunden entre sí, como 0/O o 1/I/L).
const CARACTERES = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generarCodigo(longitud = 6) {
  let codigo = '';
  for (let i = 0; i < longitud; i++) {
    const indice = Math.floor(Math.random() * CARACTERES.length);
    codigo += CARACTERES[indice];
  }
  return codigo;
}