var FmsDriveGuard = (function () {
  "use strict";

  var GOOGLE_FOLDER = "application/vnd.google-apps.folder";
  var GOOGLE_SHORTCUT = "application/vnd.google-apps.shortcut";

  function assertOwner() {
    var actual = String(Session.getEffectiveUser().getEmail() || "").toLowerCase();
    if (actual !== FMS_SETTINGS.ownerEmail.toLowerCase()) {
      throw new Error("Brak dostępu. Aplikacja jest przeznaczona wyłącznie dla właściciela.");
    }
  }

  function metadata(fileId) {
    return Drive.Files.get(fileId, { fields: "id,name,mimeType,parents,trashed" });
  }

  function assertRoot() {
    assertOwner();
    var root = metadata(FMS_SETTINGS.driveRootFolderId);
    if (root.trashed || root.mimeType !== GOOGLE_FOLDER) {
      throw new Error("Skonfigurowany folder projektu nie istnieje albo nie jest folderem.");
    }
    return root;
  }

  function assertDirectChild(fileId) {
    assertRoot();
    var item = metadata(fileId);
    if (item.trashed || item.mimeType === GOOGLE_SHORTCUT) {
      throw new Error("Zasób jest usunięty albo jest skrótem; operacja została zablokowana.");
    }
    if ((item.parents || []).indexOf(FMS_SETTINGS.driveRootFolderId) < 0) {
      throw new Error("Zasób znajduje się poza dozwolonym folderem projektu.");
    }
    return item;
  }

  function assertProjectLocation() {
    return assertDirectChild(ScriptApp.getScriptId());
  }

  function createSpreadsheetInRoot(name) {
    assertRoot();
    var created = Drive.Files.create({
      name: name,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [FMS_SETTINGS.driveRootFolderId],
    }, null, { fields: "id,name,mimeType,parents" });
    assertDirectChild(created.id);
    return created.id;
  }

  return {
    assertOwner: assertOwner,
    assertRoot: assertRoot,
    assertDirectChild: assertDirectChild,
    assertProjectLocation: assertProjectLocation,
    createSpreadsheetInRoot: createSpreadsheetInRoot,
  };
})();
