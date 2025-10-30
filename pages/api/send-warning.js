const sessions = global.__SESSIONS__ || (global.__SESSIONS__ = new Map());
const warnings = global.__WARNINGS__ || (global.__WARNINGS__ = new Map());

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { code, token, studentName, text } = req.body || {};
  if (!code || !token || !studentName || !text) return res.status(400).json({ error: "missing" });
  const s = sessions.get(code);
  if (!s || s.teacherToken !== token) return res.status(403).json({ error: "not allowed" });
  const key = `${code}:${studentName}`;
  warnings.set(key, { text, expires: Date.now() + 10_000 });
  return res.json({ ok: true });
}
