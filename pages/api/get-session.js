const sessions = global.__SESSIONS__ || (global.__SESSIONS__ = new Map());

export default function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "no code" });
  const s = sessions.get(code);
  if (!s) return res.status(404).json({ error: "session not found" });
  return res.json({
    teacherName: s.teacherName,
    allowedTools: s.allowedTools,
    gradeLevel: s.gradeLevel,
    subject: s.subject,
    viewEnabled: !!s.viewEnabled
  });
}
