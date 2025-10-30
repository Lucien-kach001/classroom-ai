export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  
  // FIX 1 (Server-side): IGNORE 'model' from body, as we will hardcode it.
  const { prompt, maxTokens = 8192 } = req.body || {};
  
  if (!prompt) return res.status(400).json({ error: "missing prompt" });
  
  // Ensure the GEMINI_API_KEY environment variable is set.
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "no api key set on server" });

  // Use the desired model name directly.
  const modelToUse = "gemini-2.5-flash-lite";

  try {
    // Use the stable model name in the API call URL.
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: "You are a helpful classroom assistant.",
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        config: {
          maxOutputTokens: maxTokens, 
          temperature: 0.4
        }
      })
    });
    
    // FIX 2 (Server-side): Check for successful response from the external API.
    if (!r.ok) {
        // Log details from the external API's response for debugging
        const errorDetails = await r.text();
        console.error("External Gemini API failed:", r.status, r.statusText, errorDetails);
        throw new Error("External LLM API call failed.");
    }
    
    const data = await r.json();
    
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
    return res.json({ text, raw: data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "LLM error", details: String(e) });
  }
}
