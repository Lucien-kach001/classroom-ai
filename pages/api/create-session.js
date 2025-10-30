import { nanoid } from "nanoid";

const sessions = global.__SESSIONS__ || (global.__SESSIONS__ = new Map());

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { teacherName, allowedTools = [], gradeLevel = "", subject = "", viewEnabled = false } = req.body || {};
  const code = (Math.floor(Math.random()*900000) + 100000).toString(); // 6-digit
  const teacherToken = nanoid();
  sessions.set(code, {
    teacherName,
    allowedTools,
    gradeLevel,
    subject,
    viewEnabled,
    teacherToken,
    createdAt: Date.now(),
    students: {}
  });
  return res.json({ code, teacherToken });
}
