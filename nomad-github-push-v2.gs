// NOMAD & SOUL — GitHub Push Script (v2 — zelfreinigend)
// Zet dit in Google Apps Script en stel een trigger in op "Time-driven > Minutes timer > Every 5 minutes"
// Of run handmatig via Uitvoeren > pushNewFilesToGitHub
//
// v2 — WAT IS NIEUW:
// Als er per ongeluk meerdere bestanden met dezelfde naam in de Drive-map staan
// (bijv. twee keer "index.html"), pushte de oude versie van dit script ALLE
// exemplaren naar GitHub, in willekeurige volgorde — waardoor niet te voorspellen
// was welke versie uiteindelijk live kwam te staan.
// Dit script pusht nu alleen het MEEST RECENT GEWIJZIGDE bestand per naam, en
// verplaatst de oudere duplicaten automatisch naar de prullenbak. Zo kan dit
// probleem zichzelf niet meer herhalen, ook niet als er per ongeluk een dubbel
// bestand wordt aangemaakt.
//
// INSTALLATIE (vervangt het huidige script 1-op-1, geen herconfiguratie nodig):
// 1. Ga naar script.google.com → open het "GitHub Push" project
// 2. Vervang ALLE code door deze inhoud
// 3. Opslaan (dit script draait via een tijd-trigger, geen "Nieuwe implementatie" nodig)

var CONFIG = {
  GITHUB_TOKEN: "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",
  GITHUB_OWNER: "nomadandsoul",
  GITHUB_REPO: "nomad-curator",
  GITHUB_BRANCH: "main",
  DRIVE_FOLDER_ID: "1i_awMZ_HpDCRWUQmEPi1xZCNgmLVz84k"
};

function pushNewFilesToGitHub() {
  var folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  var files = folder.getFiles();
  var results = [];

  // Stap 1: verzamel alle .html/.json bestanden en bepaal per bestandsnaam
  // welk exemplaar het meest recent gewijzigd is.
  var laatsteVersie = {};   // filename -> File
  var alleBestanden = [];   // alle gevonden File objecten (voor duplicaat-check)

  while (files.hasNext()) {
    var file = files.next();
    var filename = file.getName();

    if (!filename.endsWith('.html') && !filename.endsWith('.json')) continue;

    alleBestanden.push(file);

    if (!laatsteVersie[filename] || file.getLastUpdated().getTime() > laatsteVersie[filename].getLastUpdated().getTime()) {
      laatsteVersie[filename] = file;
    }
  }

  // Stap 2: verwijder duplicaten — alles wat niet de "laatste versie" is
  // van zijn bestandsnaam, gaat naar de prullenbak.
  alleBestanden.forEach(function (file) {
    var filename = file.getName();
    if (file.getId() !== laatsteVersie[filename].getId()) {
      try {
        file.setTrashed(true);
        results.push("🗑️ Duplicaat opgeruimd: " + filename + " (ouder exemplaar, id " + file.getId() + ")");
      } catch (e) {
        results.push("⚠️ Kon duplicaat niet opruimen: " + filename + " — " + e.toString());
      }
    }
  });

  // Stap 3: push enkel de meest recente versie van elk uniek bestand
  Object.keys(laatsteVersie).forEach(function (filename) {
    var file = laatsteVersie[filename];
    try {
      var blob = file.getBlob();
      var bytes = blob.getBytes();
      var b64content = Utilities.base64Encode(bytes);

      var sha = getFileSHA(filename);

      var payload = {
        message: "Auto-update via Apps Script: " + filename,
        content: b64content,
        branch: CONFIG.GITHUB_BRANCH
      };

      if (sha) {
        payload.sha = sha;
      }

      var response = UrlFetchApp.fetch(
        "https://api.github.com/repos/" + CONFIG.GITHUB_OWNER + "/" + CONFIG.GITHUB_REPO + "/contents/" + filename,
        {
          method: "put",
          headers: {
            "Authorization": "token " + CONFIG.GITHUB_TOKEN,
            "Content-Type": "application/json",
            "Accept": "application/vnd.github.v3+json"
          },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        }
      );

      var code = response.getResponseCode();
      if (code === 200 || code === 201) {
        results.push("✅ " + filename + " gepusht naar GitHub");
      } else {
        results.push("❌ " + filename + " fout: " + code + " — " + response.getContentText().substring(0, 100));
      }

    } catch (e) {
      results.push("❌ " + filename + " error: " + e.toString());
    }
  });

  Logger.log(results.join("\n"));
  return results;
}

function getFileSHA(filename) {
  try {
    var response = UrlFetchApp.fetch(
      "https://api.github.com/repos/" + CONFIG.GITHUB_OWNER + "/" + CONFIG.GITHUB_REPO + "/contents/" + filename + "?ref=" + CONFIG.GITHUB_BRANCH,
      {
        method: "get",
        headers: {
          "Authorization": "token " + CONFIG.GITHUB_TOKEN,
          "Accept": "application/vnd.github.v3+json"
        },
        muteHttpExceptions: true
      }
    );

    if (response.getResponseCode() === 200) {
      var data = JSON.parse(response.getContentText());
      return data.sha;
    }
    return null;
  } catch (e) {
    return null;
  }
}
