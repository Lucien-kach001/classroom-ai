const sessions = global.__SESSIONS__ || (global.__SESSIONS__ = new Map());

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { code, studentName, report } = req.body || {};
  if (!code || !studentName || !report) return res.status(400).json({ error: "missing" });
  const s = sessions.get(code);
  if (!s) return res.status(404).json({ error: "session not found" });
  s.students[studentName] = {
    ...(s.students[studentName] || {}),
    lastReport: { report, ts: Date.now() }
  };
  return res.json({ ok: true });
}
