const sessions = global.__SESSIONS__ || (global.__SESSIONS__ = new Map());

export default function handler(req, res) {
  const { code, token } = req.query;
  if (!code || !token) return res.status(400).json({ error: "missing" });
  const s = sessions.get(code);
  if (!s || s.teacherToken !== token) return res.status(403).json({ error: "not allowed" });
  const out = {};
  for (const [name, info] of Object.entries(s.students)) {
    out[name] = info.lastReport || null;
  }
  return res.json({ reports: out });
}
