const sessions = global.__SESSIONS__ || (global.__SESSIONS__ = new Map());

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { code, studentName, snapshot } = req.body || {};
  if (!code || !studentName) return res.status(400).json({ error: "missing" });
  const s = sessions.get(code);
  if (!s) return res.status(404).json({ error: "session not found" });
  s.students[studentName] = {
    ...(s.students[studentName] || {}),
    lastView: { snapshot, ts: Date.now() },
    lastSeen: Date.now()
  };
  return res.json({ ok: true });
}
