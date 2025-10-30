const warnings = global.__WARNINGS__ || (global.__WARNINGS__ = new Map());

export default function handler(req, res) {
  const { code, studentName } = req.query;
  if (!code || !studentName) return res.status(400).json({ error: "missing" });
  const key = `${code}:${studentName}`;
  const w = warnings.get(key);
  if (!w) return res.json({ active: false });
  if (Date.now() > w.expires) {
    warnings.delete(key);
    return res.json({ active: false });
  }
  return res.json({ active: true, text: w.text, ttl: Math.max(0, Math.round((w.expires - Date.now())/1000)) });
}
