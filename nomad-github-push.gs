// NOMAD & SOUL — GitHub Push Script
// Zet dit in Google Apps Script en stel een trigger in op "Time-driven > Minutes timer > Every 5 minutes"
// Of run handmatig via Uitvoeren > pushNewFilesToGitHub

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

  while (files.hasNext()) {
    var file = files.next();
    var filename = file.getName();
    
    // Alleen .html en .json bestanden
    if (!filename.endsWith('.html') && !filename.endsWith('.json')) continue;
    
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
      
    } catch(e) {
      results.push("❌ " + filename + " error: " + e.toString());
    }
  }
  
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
  } catch(e) {
    return null;
  }
}