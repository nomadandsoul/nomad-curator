/*
 * Nomad & Soul — /api/boho-dropship-scraper
 * -----------------------------------------------------------------
 * Vercel Serverless Function (Node.js). Enige plek waar Composio/Apify
 * credentials bestaan — uitsluitend via server-omgevingsvariabelen,
 * nooit in de browser, localStorage of app-console.
 *
 * DEPLOY / CONFIGUREREN (eenmalig, ~2 minuten):
 * 1. Importeer deze repo in Vercel (vercel.com → Add New → Project).
 * 2. Project Settings → Environment Variables, voeg toe (alles optioneel —
 *    zonder deze draait de skill automatisch in demo-modus):
 *      COMPOSIO_API_KEY            Composio API key
 *      COMPOSIO_APIFY_ACCOUNT_ID   Composio connected_account_id voor Apify
 *      APIFY_TOKEN                 Apify API token (directe fallback, i.p.v. Composio)
 *      APIFY_ACTOR_ID              Apify actor id/slug (default: apify/google-search-scraper)
 * 3. Deploy. De frontend (skills/boho-dropship-scraper.js) roept dit
 *    endpoint relatief aan ('/api/boho-dropship-scraper') en werkt
 *    hierdoor direct op elk apparaat — geen configuratie in de browser.
 */
'use strict';

const { runScraper } = require('./_lib/boho-scraper-core');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ source: 'error', error: 'Method not allowed', results: [] });
    return;
  }

  const params = req.method === 'POST' ? (req.body || {}) : (req.query || {});
  const minLevering = params.minLevering !== undefined ? parseInt(params.minLevering, 10) : undefined;

  const cfg = {
    composioApiKey: process.env.COMPOSIO_API_KEY || '',
    composioConnectedAccountId: process.env.COMPOSIO_APIFY_ACCOUNT_ID || '',
    apifyToken: process.env.APIFY_TOKEN || '',
    apifyActorId: process.env.APIFY_ACTOR_ID || ''
  };

  try {
    const data = await runScraper(
      { searchTerm: params.searchTerm, region: params.region, minLevering },
      cfg
    );
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      source: 'error',
      error: err && err.message ? err.message : String(err),
      results: []
    });
  }
};
