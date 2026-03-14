// pages/api/ai.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in Vercel environment variables' });
  }

  const { type, symbol, displayName, price, signal, rsi, fromHigh, tgt1, slPrice } = req.body;

  let prompt = '';

  if (type === 'stockdata') {
    prompt = `Return ONLY a JSON object for ${displayName} (${symbol}) NSE India stock as of March 2026. No explanation, no markdown, no backticks. Only raw JSON.

Example format:
{"price":41.62,"prevClose":42.10,"high52":74.30,"low52":38.17,"rsi":38.5,"signal":"BUY","confidence":72,"closes30d":[45,44,43,42,41,40,39,38,39,40,41,42,41,40,39,38,37,38,39,40,41,42,41,40,41,42,41,40,41,41.62]}

Fill with real approximate values for ${displayName}. All values must be plain numbers not strings.`;

  } else if (type === 'analysis') {
    prompt = `You are a concise Indian stock market analyst. Analyse ${displayName} trading at ₹${price}.

Technical data:
- Signal: ${signal}
- RSI: ${rsi}
- From 52-week high: ${fromHigh}%
- Target (1-2 months): ₹${tgt1}
- Stop loss: ₹${slPrice}

Give a sharp 4-5 line analysis:
1. Why the current signal makes sense right now
2. Key catalyst or risk to watch
3. What would change this signal
4. One-line verdict

Be direct, specific to Indian market. No fluff.`;

  } else {
    return res.status(400).json({ error: 'Invalid type' });
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
      const errMsg = data?.error?.message || JSON.stringify(data);
      return res.status(200).json({ error: errMsg }); // return 200 so frontend handles it gracefully
    }

    const text = data?.content?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
