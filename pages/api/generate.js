export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  // Changed default model to Gemini 2.5 Flash-Lite and maxTokens to a common max value for it (8192).
  const { prompt, model = "gemini-2.5-flash-lite", maxTokens = 8192 } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "missing prompt" });
  // Changed expected environment variable to GEMINI_API_KEY
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "no api key set on server" });

  try {
    // Changed API endpoint to the Gemini API and included the API key as a query parameter
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      // Removed Authorization header, as API key is in the URL
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Model is specified in the URL path
        // System instruction is a separate top-level field
        systemInstruction: "You are a helpful classroom assistant.",
        // Messages are structured as 'contents' with 'parts'
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        // Configuration parameters are nested under 'config'
        config: {
          maxOutputTokens: maxTokens, // Gemini uses maxOutputTokens
          temperature: 0.4 // Temperature is the same
        }
      })
    });
    const data = await r.json();
    
    // Changed response parsing to match the Gemini API structure
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
    return res.json({ text, raw: data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "LLM error", details: String(e) });
  }
}
