// api/search.js — Vercel Serverless Function
// Proxies Yahoo Finance search/autocomplete from server — no CORS issues

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query is required' });

  const yahooSearch = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0&listsCount=0`;

  try {
    const response = await fetch(yahooSearch, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://finance.yahoo.com',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Yahoo Finance search returned ${response.status}` });
    }

    const data = await response.json();

    // Cache search results for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300');
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Search failed' });
  }
}
