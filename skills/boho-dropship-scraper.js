/*
 * Nomad & Soul — EU Boho Wintercollectie Dropship Scraper (frontend skill)
 * -----------------------------------------------------------------------
 * Zuivere client: roept het eigen backend-endpoint
 * (/api/boho-dropship-scraper, een Vercel Serverless Function) aan.
 * Composio/Apify credentials leven UITSLUITEND op de server, in
 * process.env — deze file bevat, leest en vraagt nooit om API-sleutels.
 * De knop werkt hierdoor identiek op MacBook, iPhone en iPad, zonder
 * enige configuratie vooraf.
 *
 * Als het backend-endpoint (nog) niet bereikbaar is — bv. de site
 * draait alleen als statische GitHub Pages-hosting zonder Vercel-
 * deployment, of er is geen netwerk — valt de skill terug op een
 * kleine, duidelijk gelabelde lokale voorbeeldset zodat de knop altijd
 * een resultaat toont. Zodra de backend wél bereikbaar is, neemt die
 * automatisch het over (en meldt zelf of hij in live- of demo-modus
 * draait, afhankelijk van de server-omgevingsvariabelen).
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

  const BACKEND_ENDPOINT = '/api/boho-dropship-scraper';

  function lokaleVoorbeeldResultaten() {
    return [
      {
        productnaam: 'Boho Winter Knitwear — B2B Dropship Collectie',
        leverancier: 'ibiza-wholesale-textiles.eu (lokaal voorbeeld)',
        locatie: 'Spanje (EU)',
        levertijd: '3-5 werkdagen (EU-voorraad, indicatief)',
        dropshipStatus: 'Dropship-signalen gevonden (2)',
        kwaliteit: 'Uitstekend',
        link: 'https://example.com/ibiza-wholesale-textiles'
      },
      {
        productnaam: 'Bohemian Outerwear Reseller Program',
        leverancier: 'nordicboho-tradehub.eu (lokaal voorbeeld)',
        locatie: 'Nederland (EU)',
        levertijd: '3-5 werkdagen (EU-voorraad, indicatief)',
        dropshipStatus: 'Dropship-signalen gevonden (2)',
        kwaliteit: 'Uitstekend',
        link: 'https://example.com/nordicboho-tradehub'
      },
      {
        productnaam: 'Ibiza-Style Boho Vesten — Groothandel Portaal',
        leverancier: 'sunwovengoods.eu (lokaal voorbeeld)',
        locatie: 'Portugal (EU)',
        levertijd: '2-5 werkdagen',
        dropshipStatus: 'Dropship-signalen gevonden (3)',
        kwaliteit: 'Uitstekend',
        link: 'https://example.com/sunwovengoods'
      }
    ];
  }

  async function runBohoDropshipScraper(params = {}) {
    const opts = {
      searchTerm: params.searchTerm || 'boho winter collectie',
      region: params.region || 'EU',
      minLevering: params.minLevering || 5
    };

    try {
      const res = await fetch(BACKEND_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts)
      });
      if (!res.ok) throw new Error(`Backend gaf status ${res.status}`);
      const data = await res.json();
      if (!data || !Array.isArray(data.results)) throw new Error('Onverwacht antwoord van backend');
      return data;
    } catch (err) {
      return {
        source: 'offline-fallback',
        params: opts,
        results: lokaleVoorbeeldResultaten(),
        error: err && err.message ? err.message : String(err)
      };
    }
  }

  global.NomadBohoScraper = {
    run: runBohoDropshipScraper
  };
})(typeof window !== 'undefined' ? window : globalThis);
