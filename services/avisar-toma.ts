// Edge Function: avisar-toma
// Supabase -> Edge Functions -> Deploy a new function -> Via Editor
// Nombre EXACTO de la función: avisar-toma
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;

    // Cliente con la sesión de quien aprieta el botón
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });

    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) return json({ error: 'no_autorizado' }, 401);

    const { observado_id, pendientes } = await req.json();
    if (!observado_id) return json({ error: 'falta_observado_id' }, 400);

    // Cliente con permisos totales (solo vive en el servidor)
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Solo puede avisar quien realmente supervisa a esa persona
    const { data: enlace } = await admin
      .from('cuentas_enlazadas')
      .select('id')
      .eq('observador_id', user.id)
      .eq('observado_id', observado_id)
      .maybeSingle();

    if (!enlace) return json({ error: 'sin_permiso' }, 403);

    // Token del celular de la persona supervisada
    const { data: destino } = await admin
      .from('push_tokens')
      .select('token')
      .eq('perfil_id', observado_id)
      .maybeSingle();

    if (!destino?.token) return json({ error: 'sin_token' });

    const { data: yo } = await admin
      .from('perfiles')
      .select('apodo')
      .eq('id', user.id)
      .maybeSingle();

    const lista = Array.isArray(pendientes) ? pendientes : [];
    const detalle = lista.slice(0, 3).join(', ');

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: destino.token,
        title: 'Recordatorio de medicamentos 💊',
        body: `${yo?.apodo ?? 'Alguien'} te recuerda tomar: ${detalle || 'tus medicamentos'}`,
        sound: 'default',
        channelId: 'medicamentos',
        priority: 'high',
      }),
    });

    const resultado = await res.json();

    if (resultado?.data?.status === 'error') {
      return json({ error: 'envio_fallido', detalle: resultado.data });
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: 'error_interno', detalle: String(e) }, 500);
  }
});