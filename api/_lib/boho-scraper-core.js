/*
 * Nomad & Soul — EU Boho Wintercollectie Dropship Scraper (server-side core)
 * -----------------------------------------------------------------------
 * Gedeelde logica voor api/boho-dropship-scraper.js. Draait uitsluitend
 * op de server (Node.js / Vercel Serverless Function) — nooit in de
 * browser. Credentials worden nooit hier gelezen; ze worden door de
 * caller (de serverless handler) aangeleverd via het `cfg`-object, dat
 * op zijn beurt uit process.env komt.
 */
'use strict';

const DEFAULT_APIFY_ACTOR_ID = 'apify/google-search-scraper';
const COMPOSIO_EXECUTE_URL =
  'https://backend.composio.dev/api/v3/tools/execute/APIFY_RUN_ACTOR_SYNCHRONOUSLY_GET_DATASET_ITEMS';

const DROPSHIP_SIGNALEN = [
  'dropshipping available', 'b2b dropshipping europe', 'dropship program',
  'dropship programma', 'wholesale', 'groothandel', 'csv feed', 'xml feed',
  'shopify feed', 'reseller programma', 'reseller program', 'b2b portal',
  'b2b registratie', 'become a reseller', 'trade account', 'stockist application',
  'become a stockist', 'partner worden'
];

const EU_LANDEN = [
  'nl', 'nederland', 'be', 'belgië', 'belgie', 'de', 'duitsland', 'germany',
  'fr', 'frankrijk', 'france', 'es', 'spanje', 'spain', 'it', 'italië', 'italy',
  'pt', 'portugal', 'pl', 'polen', 'poland', 'at', 'oostenrijk', 'austria',
  'dk', 'denemarken', 'denmark', 'se', 'zweden', 'sweden', 'fi', 'finland',
  'ie', 'ierland', 'ireland', 'lu', 'luxemburg', 'cz', 'tsjechië', 'czechia',
  'gr', 'griekenland', 'greece', 'ro', 'roemenië', 'romania', 'hu', 'hongarije',
  'europa', 'europe', 'eu'
];

function buildSearchQueries(searchTerm, region) {
  const basis = (searchTerm || 'boho winter collectie').trim();
  const regioTerm = region === 'EU' ? 'Europe EU' : region;
  return [
    `${basis} dropshipping supplier ${regioTerm} wholesale`,
    `${basis} groothandel B2B dropshipping CSV XML Shopify feed`,
    `${basis} wholesale reseller programma B2B registratie Europa`
  ];
}

function detectDropshipSignalen(text) {
  if (!text) return [];
  const lower = String(text).toLowerCase();
  return DROPSHIP_SIGNALEN.filter((k) => lower.includes(k));
}

function detectEuOrigine(raw) {
  const veld = [raw.country, raw.location, raw.domain, raw.snippet, raw.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return EU_LANDEN.some((code) => new RegExp('\\b' + code + '\\b').test(veld));
}

function schatLevertijd(text) {
  const match = text && text.match(/(\d{1,2})\s*[-–to]{1,3}\s*(\d{1,2})\s*(werkdag|business day|dag|day)/i);
  if (match) return `${match[1]}-${match[2]} werkdagen`;
  return '3-5 werkdagen (EU-voorraad, indicatief)';
}

function kwaliteitBadge(signalen, euOrigine) {
  let score = euOrigine ? 2 : 0;
  score += Math.min(signalen.length, 3);
  if (score >= 4) return 'Uitstekend';
  if (score >= 2) return 'Goed';
  return 'Controleer handmatig';
}

function domeinVan(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (e) {
    return url || 'onbekend';
  }
}

function structureerResultaat(raw) {
  const tekst = [raw.title, raw.description, raw.snippet, raw.pageContent].filter(Boolean).join(' ');
  const signalen = detectDropshipSignalen(tekst);
  const euOrigine = detectEuOrigine(raw);
  return {
    productnaam: raw.title || raw.name || 'Onbekende collectie',
    leverancier: raw.siteName || (raw.url ? domeinVan(raw.url) : 'Onbekend'),
    locatie: raw.country || raw.location || (euOrigine ? 'Europa (EU)' : 'Onbekend — handmatig checken'),
    levertijd: schatLevertijd(tekst),
    dropshipStatus: signalen.length
      ? `Dropship-signalen gevonden (${signalen.length})`
      : 'Niet bevestigd — handmatig checken',
    kwaliteit: kwaliteitBadge(signalen, euOrigine),
    link: raw.url || raw.link || '#',
    signalen: signalen,
    euOrigine: euOrigine
  };
}

async function callComposio(actorInput, cfg) {
  const res = await fetch(COMPOSIO_EXECUTE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.composioApiKey
    },
    body: JSON.stringify({
      connected_account_id: cfg.composioConnectedAccountId || undefined,
      arguments: {
        actorId: cfg.apifyActorId || DEFAULT_APIFY_ACTOR_ID,
        input: actorInput
      }
    })
  });
  if (!res.ok) throw new Error(`Composio-aanroep mislukt (${res.status})`);
  const data = await res.json();
  return (data && (data.data || data.items || data.output)) || [];
}

async function callApifyDirect(actorInput, cfg) {
  const actorId = cfg.apifyActorId || DEFAULT_APIFY_ACTOR_ID;
  const url = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(cfg.apifyToken)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(actorInput)
  });
  if (!res.ok) throw new Error(`Apify-aanroep mislukt (${res.status})`);
  return await res.json();
}

function voorbeeldResultaten() {
  const items = [
    {
      title: 'Boho Winter Knitwear — B2B Dropship Collectie',
      siteName: 'ibiza-wholesale-textiles.eu (voorbeeld)',
      country: 'Spanje (EU)',
      url: 'https://example.com/ibiza-wholesale-textiles',
      description: 'Wholesale groothandel gebreide vesten en bohemian jassen. Dropshipping available, Shopify CSV feed, B2B registratieportaal.',
      snippet: 'dropshipping available shopify feed groothandel'
    },
    {
      title: 'Bohemian Outerwear Reseller Program',
      siteName: 'nordicboho-tradehub.eu (voorbeeld)',
      country: 'Nederland (EU)',
      url: 'https://example.com/nordicboho-tradehub',
      description: 'B2B dropshipping Europe met reseller programma en XML productfeed voor bohemian winterjassen en accessoires.',
      snippet: 'b2b dropshipping europe reseller programma xml feed'
    },
    {
      title: 'Ibiza-Style Boho Vesten — Groothandel Portaal',
      siteName: 'sunwovengoods.eu (voorbeeld)',
      country: 'Portugal (EU)',
      url: 'https://example.com/sunwovengoods',
      description: 'Groothandel en dropship programma voor boho-chic gebreide vesten, verzending 2-5 werkdagen binnen Europa. B2B contactformulier beschikbaar.',
      snippet: 'wholesale dropship programma b2b registratie 2-5 werkdagen'
    },
    {
      title: 'Bohemian Winter Accessoires — CSV Dropship Feed',
      siteName: 'terraboheme-supply.eu (voorbeeld)',
      country: 'België (EU)',
      url: 'https://example.com/terraboheme-supply',
      description: 'Trade account & stockist application voor boho-accessoires. CSV/XML feed en automatische orderdoorzetting voor dropshippers.',
      snippet: 'trade account stockist application csv feed automatische orderdoorzetting'
    },
    {
      title: 'Winter Boho Cardigans — Dropship & Wholesale',
      siteName: 'atelier-desierto.eu (voorbeeld)',
      country: 'Onbekend — handmatig checken',
      url: 'https://example.com/atelier-desierto',
      description: 'Kleine atelier-leverancier, wholesale mogelijk op aanvraag. Geen expliciete dropship-feed vermeld.',
      snippet: 'wholesale op aanvraag'
    }
  ];
  return items.map(structureerResultaat);
}

/**
 * @param {{searchTerm?:string, region?:string, minLevering?:number}} params
 * @param {{composioApiKey?:string, composioConnectedAccountId?:string, apifyToken?:string, apifyActorId?:string}} cfg
 *   cfg komt uit process.env op de server — nooit uit de browser.
 */
async function runScraper(params, cfg) {
  const opts = {
    searchTerm: (params && params.searchTerm) || 'boho winter collectie',
    region: (params && params.region) || 'EU',
    minLevering: (params && params.minLevering) || 5
  };
  cfg = cfg || {};

  if (!cfg.composioApiKey && !cfg.apifyToken) {
    return { source: 'demo', params: opts, results: voorbeeldResultaten() };
  }

  const queries = buildSearchQueries(opts.searchTerm, opts.region);
  const actorInput = {
    queries: queries.join('\n'),
    resultsPerPage: 10,
    maxPagesPerQuery: 1,
    countryCode: 'nl'
  };

  try {
    let ruweItems = [];
    let source = 'demo';
    if (cfg.composioApiKey) {
      ruweItems = await callComposio(actorInput, cfg);
      source = 'live-composio';
    } else if (cfg.apifyToken) {
      ruweItems = await callApifyDirect(actorInput, cfg);
      source = 'live-apify';
    }
    if (Array.isArray(ruweItems) && ruweItems.length) {
      return { source, params: opts, results: ruweItems.map(structureerResultaat) };
    }
    return { source: 'demo', params: opts, results: voorbeeldResultaten() };
  } catch (err) {
    return {
      source: 'demo-fallback',
      params: opts,
      results: voorbeeldResultaten(),
      error: err && err.message ? err.message : String(err)
    };
  }
}

module.exports = { runScraper, voorbeeldResultaten, structureerResultaat };
