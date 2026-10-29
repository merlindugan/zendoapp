// ZendoApp · envío de avisos al celular (Firebase Cloud Messaging)
// Vercel ejecuta este archivo en /api/notify.
// Necesita la variable de entorno FIREBASE_SERVICE_ACCOUNT (el JSON de la cuenta de servicio de Firebase).
const admin = require('firebase-admin');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'merdugan99@gmail.com').toLowerCase();
const MON = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const DOW = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function init() {
  if (admin.apps.length) return true;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return false;
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
  return true;
}

const fecha = s => {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DOW[dt.getUTCDay()]} ${d} ${MON[m - 1]}`;
};
const wait = ms => new Promise(r => setTimeout(r, ms));

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!init()) return res.status(500).json({ error: 'Falta FIREBASE_SERVICE_ACCOUNT en Vercel' });

  // Quién llama
  const auth = String(req.headers.authorization || '');
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Sin sesión' });
  let user;
  try { user = await admin.auth().verifyIdToken(auth.slice(7)); }
  catch (e) { return res.status(401).json({ error: 'Sesión inválida' }); }
  const isAdmin = (user.email || '').toLowerCase() === ADMIN_EMAIL;

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { type, id } = body;
  if (!['request', 'reply'].includes(type) || typeof id !== 'string' || !id) return res.status(400).json({ error: 'Datos inválidos' });

  const db = admin.firestore();
  // La reserva puede tardar un instante en guardarse: reintento unas veces.
  let snap;
  for (let i = 0; i < 4; i++) { snap = await db.collection('res').doc(id).get(); if (snap.exists) break; await wait(1000); }
  if (!snap.exists) return res.status(404).json({ error: 'Turno no encontrado' });
  const r = snap.data();

  let targets, title, text, key;
  const st = (await db.collection('students').doc(r.sid).get()).data() || {};
  const nombre = [st.nombre, st.apellido].filter(Boolean).join(' ') || 'Un alumno';

  if (type === 'request') {
    if (r.status !== 'pend') return res.status(200).json({ ok: true, skipped: 'no pendiente' });
    key = `request_${id}`;
    targets = await db.collection('tokens').where('role', '==', 'admin').get();
    title = 'Solicitud de turno';
    text = `${nombre} pide el ${fecha(r.date)} a las ${r.h}`;
  } else {
    if (!isAdmin) return res.status(403).json({ error: 'Sólo el profe' });
    if (!['ok', 'rech'].includes(r.status)) return res.status(200).json({ ok: true, skipped: 'sin respuesta' });
    key = `reply_${id}_${r.status}`;
    targets = await db.collection('tokens').where('role', '==', 'student').where('sid', '==', r.sid).get();
    title = r.status === 'ok' ? 'Turno confirmado ✓' : 'Turno rechazado';
    text = r.status === 'ok'
      ? `Te esperamos el ${fecha(r.date)} a las ${r.h}`
      : `El profe no pudo confirmar el ${fecha(r.date)} a las ${r.h}. Pedí otro horario.`;
  }

  // No mandar el mismo aviso dos veces
  const mark = db.collection('notified').doc(key);
  try { await mark.create({ at: Date.now() }); }
  catch (e) { return res.status(200).json({ ok: true, skipped: 'ya enviado' }); }

  const tokens = targets.docs.map(d => d.id);
  if (!tokens.length) return res.status(200).json({ ok: true, sent: 0 });

  const out = await admin.messaging().sendEachForMulticast({
    tokens,
    data: { title, body: text, tag: key, url: '/' },
    webpush: { headers: { Urgency: 'high', TTL: '86400' } },
  });
  // Borrar celulares que ya no existen
  await Promise.all(out.responses.map((x, i) => {
    const c = x.error && x.error.code;
    if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token')
      return db.collection('tokens').doc(tokens[i]).delete().catch(() => {});
  }));
  return res.status(200).json({ ok: true, sent: out.successCount });
};
