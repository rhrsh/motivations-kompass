// Kleiner Webserver für Tests, ohne Pakete. Bildet die echte Auslieferung nach:
//   /        Production (dieser Stand)
//   /beta/   Beta (hier derselbe Stand, aber eigene Umgebung mit eigener Datenbank)
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
  p = p.slice(BASE.length).replace(/^\/beta\//, "/");
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT) || /[\\/](node_modules|tests|\.git)[\\/]/.test(file)) { res.writeHead(404); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  });
}).listen(PORT, () => console.log(`http://localhost:${PORT}${BASE}/`));
