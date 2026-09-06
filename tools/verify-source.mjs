import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "apps-script");

for (const file of readdirSync(source).filter(name => name.endsWith(".js"))) {
  new vm.Script(readFileSync(resolve(source, file), "utf8"), { filename: file });
}

const appHtml = readFileSync(resolve(source, "App.html"), "utf8");
const script = appHtml.match(/<script>([\s\S]*)<\/script>/);
if (!script) throw new Error("App.html nie zawiera skryptu.");
new vm.Script(script[1], { filename: "App.html:inline.js" });

const manifest = JSON.parse(readFileSync(resolve(source, "appsscript.json"), "utf8"));
if (manifest.webapp?.access !== "MYSELF") throw new Error("Web app nie jest ograniczona do właściciela.");
if (!manifest.oauthScopes.includes("https://www.googleapis.com/auth/drive")) throw new Error("Brak wymaganego scope Drive.");

console.log("PASS: składnia źródeł i manifest Apps Script są poprawne.");
