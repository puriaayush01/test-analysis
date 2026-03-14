// api/ai.js — Vercel Serverless Function
// Handles all Anthropic API calls securely on the server
// API key is stored in Vercel environment variables, never exposed to browser

export default async function handler(req, res) {
  // Allow requests from any origin (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, symbol, displayName, price, signal, rsi, fromHigh, tgt1, slPrice } = req.body;

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured. Add ANTHROPIC_API_KEY in Vercel environment variables.' });
  }

  let prompt = '';

  if (type === 'stockdata') {
    // Fetch stock price, RSI, signal data
    prompt = `Return ONLY a JSON object for ${displayName} (${symbol}) NSE India stock as of March 2026. No explanation, no markdown, no backticks. Only raw JSON.

Example format:
{"price":41.62,"prevClose":42.10,"high52":74.30,"low52":38.17,"rsi":38.5,"signal":"BUY","confidence":72,"closes30d":[45,44,43,42,41,40,39,38,39,40,41,42,41,40,39,38,37,38,39,40,41,42,41,40,41,42,41,40,41,41.62]}

Fill with real approximate values for ${displayName}. All values must be plain numbers.`;

  } else if (type === 'analysis') {
    // Generate AI analysis text
    prompt = `You are a concise Indian stock market analyst. Analyse ${displayName} trading at ₹${price}.

Technical snapshot:
- Signal: ${signal}
- RSI: ${rsi}
- From 52-week high: ${fromHigh}%
- 1-2 month target: ₹${tgt1}
- Stop loss: ₹${slPrice}

Give a sharp 4-5 line analysis:
1. Why the current signal makes sense right now
2. The key catalyst or risk to watch
3. What would change this signal
4. One-line verdict

Be direct, specific to Indian market context. No fluff.`;

  } else {
    return res.status(400).json({ error: 'Invalid type. Use stockdata or analysis.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' });
    }

    const text = data?.content?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
