// npm start: serve la cartella dist in locale, solo per anteprima.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";

const dist = path.join(root, "dist");
const port = Number(process.env.PORT) || 4173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

// Se dist viene ricostruita mentre il server gira, un file può mancare per qualche istante:
// il server risponde con un messaggio invece di fermarsi.
const missing = (res) => {
  let body = "<p>Page not found. If the site is being rebuilt, reload in a few seconds.</p>";
  try { body = fs.readFileSync(path.join(dist, "404.html")); } catch {}
  if (!res.headersSent) res.writeHead(404, { "content-type": types[".html"] });
  res.end(body);
};

http.createServer((req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let file = path.join(dist, p);
    if (!file.startsWith(dist)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) { missing(res); return; }
    const stream = fs.createReadStream(file);
    stream.on("error", () => missing(res));
    stream.once("open", () => { res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" }); stream.pipe(res); });
  } catch {
    missing(res);
  }
}).listen(port, () => console.log(`Anteprima su http://localhost:${port}  (Ctrl+C per fermare)`));
