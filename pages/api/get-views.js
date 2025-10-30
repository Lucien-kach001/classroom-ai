const sessions = global.__SESSIONS__ || (global.__SESSIONS__ = new Map());

export default function handler(req, res) {
  const { code, token } = req.query;
  if (!code || !token) return res.status(400).json({ error: "missing" });
  const s = sessions.get(code);
  if (!s || s.teacherToken !== token) return res.status(404).json({ error: "not found / wrong token" });
  const result = {};
  for (const [name, info] of Object.entries(s.students)) {
    result[name] = { lastView: info.lastView || null, lastSeen: info.lastSeen || null, lastReport: info.lastReport || null };
  }
  return res.json({ students: result });
}
