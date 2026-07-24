/*
 * Nomad & Soul — EU Boho Wintercollectie Dropship Scraper (Skill)
 * -----------------------------------------------------------------
 * Zoekt B2B-groothandels/dropshippers voor boho-chic wintermode
 * (Ibiza-style, gebreide vesten, bohemian jassen, accessoires) met
 * voorraad en verzending binnen Europa.
 *
 * Aandrijving: Apify actor via Composio (met directe Apify-fallback
 * als er geen Composio-koppeling is geconfigureerd). Zonder API-
 * sleutels valt de skill terug op representatieve voorbeelddata zodat
 * de dashboard-knop altijd bruikbaar blijft.
 *
 * Configuratie (via NomadBohoScraper.saveConfig of direct in
 * localStorage), alle velden optioneel:
 *   nomad-composio-api-key            Composio API key
 *   nomad-composio-apify-account-id   Composio connected_account_id voor Apify
 *   nomad-apify-token                 Apify API token (directe fallback)
 *   nomad-apify-actor-id              Apify actor id/slug (default: hieronder)
 *
 * Gebruik:
 *   const { source, results } = await NomadBohoScraper.run({
 *     searchTerm: 'boho winter vesten',
 *     region: 'EU',
 *     minLevering: 5
 *   });
 */
(function (global) {
  'use strict';

  const STORAGE_KEYS = {
    composioApiKey: 'nomad-composio-api-key',
    composioConnectedAccountId: 'nomad-composio-apify-account-id',
    apifyToken: 'nomad-apify-token',
    apifyActorId: 'nomad-apify-actor-id'
  };

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

  function readStorage(key, fallback) {
    try {
      const v = global.localStorage ? global.localStorage.getItem(key) : null;
      return v === null || v === undefined || v === '' ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function getConfig() {
    return {
      composioApiKey: readStorage(STORAGE_KEYS.composioApiKey, ''),
      composioConnectedAccountId: readStorage(STORAGE_KEYS.composioConnectedAccountId, ''),
      apifyToken: readStorage(STORAGE_KEYS.apifyToken, ''),
      apifyActorId: readStorage(STORAGE_KEYS.apifyActorId, DEFAULT_APIFY_ACTOR_ID)
    };
  }

  function saveConfig(partial) {
    try {
      Object.keys(STORAGE_KEYS).forEach((k) => {
        if (partial[k] !== undefined) {
          global.localStorage.setItem(STORAGE_KEYS[k], partial[k]);
        }
      });
    } catch (e) { /* localStorage niet beschikbaar — sla config over */ }
    return getConfig();
  }

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
    return data && (data.data || data.items || data.output) || [];
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

  function voorbeeldResultaten(params) {
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
    return items.map(structureerResultaat).filter((r) => {
      if (params.region === 'EU' && r.locatie.includes('handmatig checken')) return true;
      return true;
    });
  }

  async function runBohoDropshipScraper(params = {}) {
    const opts = {
      searchTerm: params.searchTerm || 'boho winter collectie',
      region: params.region || 'EU',
      minLevering: params.minLevering || 5
    };
    const cfg = getConfig();
    const queries = buildSearchQueries(opts.searchTerm, opts.region);
    const actorInput = {
      queries: queries.join('\n'),
      resultsPerPage: 10,
      maxPagesPerQuery: 1,
      countryCode: 'nl'
    };

    if (!cfg.composioApiKey && !cfg.apifyToken) {
      return { source: 'demo', params: opts, results: voorbeeldResultaten(opts) };
    }

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
        const resultaten = ruweItems.map(structureerResultaat);
        return { source, params: opts, results: resultaten };
      }
      return { source: 'demo', params: opts, results: voorbeeldResultaten(opts) };
    } catch (err) {
      return {
        source: 'demo-fallback',
        params: opts,
        results: voorbeeldResultaten(opts),
        error: err && err.message ? err.message : String(err)
      };
    }
  }

  global.NomadBohoScraper = {
    run: runBohoDropshipScraper,
    getConfig: getConfig,
    saveConfig: saveConfig,
    STORAGE_KEYS: STORAGE_KEYS
  };
})(typeof window !== 'undefined' ? window : globalThis);
