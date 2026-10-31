// ZendoApp · aviso diario de cuota pendiente
// Vercel lo ejecuta todos los días a las 12:00 de Argentina (ver "crons" en vercel.json).
// Necesita las variables de entorno FIREBASE_SERVICE_ACCOUNT y CRON_SECRET.
const admin = require('firebase-admin');

const BLOQUEO = 10; // días de deuda a partir de los cuales no puede pedir turnos (igual que en index.html)
const MON = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function init() {
  if (admin.apps.length) return true;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return false;
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
  return true;
}

// Fechas como 'AAAA-MM-DD', en hora de Argentina
const hoyAR = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
const toUTC = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const addDays = (s, n) => new Date(toUTC(s) + n * 864e5).toISOString().slice(0, 10);
const diffDays = (a, b) => Math.round((toUTC(a) - toUTC(b)) / 864e5);
const fd = s => { const [, m, d] = s.split('-').map(Number); return `${d} ${MON[m - 1]}`; };

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'No autorizado' });
  if (!init()) return res.status(500).json({ error: 'Falta FIREBASE_SERVICE_ACCOUNT en Vercel' });

  const db = admin.firestore();
  const today = hoyAR();
  const [studentsQ, paysQ] = await Promise.all([db.collection('students').get(), db.collection('pays').get()]);
  const pays = paysQ.docs.map(d => d.data());

  let enviados = 0, alumnos = 0;
  for (const doc of studentsQ.docs) {
    const st = doc.data();
    if (st.inactivo || !st.pack) continue;

    // Desde cuándo tiene que pagar: deuda marcada ("No pagó") o pack vencido sin renovar
    const desde = [];
    const deuda = pays.filter(p => p.sid === st.id && p.pend).map(p => p.date).sort()[0];
    if (deuda) desde.push(deuda);
    if (st.pack.size > 0) { const fin = addDays(st.pack.start, 30); if (diffDays(fin, today) <= 0) desde.push(fin); }
    const owes = desde.sort()[0];
    if (!owes || owes > today) continue;
    alumnos++;

    // Un solo aviso por alumno por día
    try { await db.collection('notified').doc(`cobro_${st.id}_${today}`).create({ at: Date.now() }); }
    catch (e) { continue; }

    const dias = Math.max(0, diffDays(today, owes));
    const title = 'Cuota pendiente';
    const body = dias === 0
      ? `Hoy se vence tu cuota, ${st.nombre}. Acordate de pagarla.`
      : `Tenés la cuota pendiente desde el ${fd(owes)} (hace ${dias} ${dias === 1 ? 'día' : 'días'}).` +
        (dias > BLOQUEO ? ' No podés pedir turnos hasta pagar.' : ` Si pasan más de ${BLOQUEO} días se bloquea el pedido de turnos.`);

    const tq = await db.collection('tokens').where('role', '==', 'student').where('sid', '==', st.id).get();
    const tokens = tq.docs.map(d => d.id);
    if (!tokens.length) continue;
    const out = await admin.messaging().sendEachForMulticast({
      tokens,
      data: { title, body, tag: `cobro_${st.id}`, url: '/' },
      webpush: { headers: { Urgency: 'high', TTL: '43200' } },
    });
    enviados += out.successCount;
    await Promise.all(out.responses.map((x, i) => {
      const c = x.error && x.error.code;
      if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token')
        return db.collection('tokens').doc(tokens[i]).delete().catch(() => {});
    }));
  }
  return res.status(200).json({ ok: true, fecha: today, alumnosQueDeben: alumnos, avisosEnviados: enviados });
};
