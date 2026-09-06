const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

test("konfiguracja blokuje operacje poza wskazanym folderem", () => {
  const config = JSON.parse(readFileSync(resolve(__dirname,"../config/deployment.json"),"utf8"));
  assert.equal(config.driveRootFolderId,"1jFAX9C5JROxTTrnNRt9QXUMEjsKD88yZ");
  assert.equal(config.allowOutsideRoot,false);
  assert.equal(config.allowTemporaryFilesOutsideRoot,false);
  assert.equal(config.followShortcutsOutsideRoot,false);
  assert.equal(config.implementationApproved,true);
});

test("guard odrzuca skróty i wymaga bezpośredniego rodzica", () => {
  const source = readFileSync(resolve(__dirname,"../apps-script/03_DriveGuard.js"),"utf8");
  assert.match(source,/GOOGLE_SHORTCUT/);
  assert.match(source,/parents \|\| \[\]/);
  assert.match(source,/poza dozwolonym folderem/);
});
