/**
 * NOMAD & SOUL — SYNC BACKEND
 * Simpele gedeelde opslag zodat de actielijst en leverancierslijst
 * synchroniseren tussen telefoon, pc en tussen Ludo & Bionda.
 *
 * INSTALLATIE (eenmalig, ~5 minuten):
 * 1. Ga naar script.google.com → Nieuw project
 * 2. Vervang alle code door deze inhoud
 * 3. Klik "Implementeren" (Deploy) → "Nieuwe implementatie"
 * 4. Type: "Webapp"
 * 5. Uitvoeren als: Mijzelf
 * 6. Toegang: "Iedereen" (Anyone) — dit is noodzakelijk zodat het dashboard
 *    vanaf GitHub Pages kan lezen/schrijven. De URL zelf is geheim genoeg;
 *    zet geen gevoelige data hierin (dit is alleen voor actielijst/leveranciers).
 * 7. Klik Autoriseren → kies je Google-account → "Toestaan" (ondanks de waarschuwing,
 *    dit is jouw eigen script)
 * 8. Kopieer de "Web app URL" die je krijgt
 * 9. Geef die URL aan Claude — die verwerkt 'm in het dashboard
 *
 * Na elke wijziging aan dit script: Implementeren → Implementaties beheren →
 * potlood-icoon → Nieuwe versie → Implementeren (anders blijft de oude versie actief).
 */

function doGet(e) {
  const action = e.parameter.action;
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

  return jsonResponse({ error: 'onbekende action, gebruik get of set' });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
