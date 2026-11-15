// Kleiner Webserver für Tests, ohne Pakete. Bildet die echte Auslieferung nach:
//   /motivations-kompass/        Weiterleitung (root/)
//   /motivations-kompass/app/    Production (dieser Stand)
//   /motivations-kompass/beta/   Beta (hier derselbe Stand, aber eigene Umgebung mit eigener Datenbank)
// Aufruf: node tests/serve.js [port]
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.argv[2] || process.env.PORT || 4173);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png",
  ".svg": "image/svg+xml", ".json": "application/json", ".webmanifest": "application/manifest+json" };
const BASE = "/motivations-kompass"; // wie auf GitHub Pages

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (!p.startsWith(BASE + "/")) { res.writeHead(302, { Location: BASE + "/" }); return res.end(); }
  p = p.slice(BASE.length);
  if (p.endsWith("/")) p += "index.html";
  let rel;
  if (/^\/(app|beta)\//.test(p)) rel = p.replace(/^\/(app|beta)\//, "/");
  else if (p === "/index.html" || p === "/sw.js") rel = "/root" + p;
  else { res.writeHead(404); return res.end(); }
  const file = path.join(ROOT, path.normalize(rel));
  if (!file.startsWith(ROOT) || /[\\/](node_modules|tests|\.git)[\\/]/.test(file)) { res.writeHead(404); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  });
}).listen(PORT, () => console.log(`http://localhost:${PORT}${BASE}/app/`));
