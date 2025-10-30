// Minimal LLM proxy — requires OPENAI_API_KEY in env for production use.
// If you don't have a key, the endpoint returns an error. This is intentionally
// minimal and exposes only a basic proxy; do not use in production without auth.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { prompt, model = "gpt-4o-mini", maxTokens = 800 } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "missing prompt" });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "no api key set on server" });

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "system", content: "You are a helpful classroom assistant." }, { role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.4
      })
    });
    const data = await r.json();
    const text = (data?.choices?.[0]?.message?.content) || data?.choices?.[0]?.text || JSON.stringify(data);
    return res.json({ text, raw: data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "LLM error", details: String(e) });
  }
}
