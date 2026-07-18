/**
 * NOMAD & SOUL — SYNC BACKEND
 * Simpele gedeelde opslag zodat de actielijst en leverancierslijst
 * synchroniseren tussen telefoon, pc en tussen Ludo & Bionda.
 *
 * v2 — toegevoegd: 'getdoc' actie zodat het Projectoverzicht en de
 * Claude System Prompt rechtstreeks IN het dashboard geladen kunnen
 * worden (in een iframe), in plaats van door te linken naar Google Drive.
 * De documenten blijven in de besloten Drive-map staan — alleen deze
 * webapp mag ze uitlezen, en enkel via de vaste sleutelnamen hieronder
 * (nooit een los Drive-bestand-ID vanaf de dashboardkant).
 *
 * INSTALLATIE / BIJWERKEN (~2 minuten):
 * 1. Ga naar script.google.com → open het bestaande "Nomad Sync Backend" project
 * 2. Vervang ALLE code door deze inhoud
 * 3. Klik "Implementeren" (Deploy) → "Implementaties beheren"
 * 4. Klik het potlood-icoon naast de actieve implementatie → "Nieuwe versie" → Implementeren
 *    (dit is nodig, anders blijft de oude code actief — de Web app URL zelf verandert niet)
 * 5. Zelfde URL blijft gebruikt worden door het dashboard, niets te wijzigen in de HTML.
 */

// Vaste whitelist: sleutelnaam → Drive file-ID in de besloten map "Nomad & Soul - Vertrouwelijk"
const VERTROUWELIJKE_DOCUMENTEN = {
  'projectoverzicht': '1Z9PIz2R6oTgZjkgQb5D4x7gEqVPQV1Xz',
  'systemprompt': '1MP0fNiI8Sz5OhaQmqQnPuOLGfUfVdPtp'
};

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getdoc') {
    const id = e.parameter.id;
    if (!id) return jsonResponse({ error: 'id ontbreekt' });
    const fileId = VERTROUWELIJKE_DOCUMENTEN[id];
    if (!fileId) return jsonResponse({ error: 'onbekend document: ' + id });
    try {
      const file = DriveApp.getFileById(fileId);
      const html = file.getBlob().getDataAsString('UTF-8');
      return jsonResponse({ ok: true, html: html });
    } catch (err) {
      return jsonResponse({ error: 'kon document niet lezen: ' + err.message });
    }
  }

  const key = e.parameter.key;

  if (!key) {
    return jsonResponse({ error: 'key ontbreekt' });
  }

  const props = PropertiesService.getScriptProperties();

  if (action === 'get') {
    const value = props.getProperty(key);
    return jsonResponse({ key: key, value: value ? JSON.parse(value) : null });
  }

  if (action === 'set') {
    const rawValue = e.parameter.value;
    if (rawValue === undefined) {
      return jsonResponse({ error: 'value ontbreekt' });
    }
    try {
      JSON.parse(rawValue);
      props.setProperty(key, rawValue);
      props.setProperty(key + '_updated', new Date().toISOString());
      return jsonResponse({ ok: true, key: key });
    } catch (err) {
      return jsonResponse({ error: 'ongeldige JSON: ' + err.message });
    }
  }

  return jsonResponse({ error: 'onbekende action, gebruik get, set of getdoc' });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
