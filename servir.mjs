/* Servidor estático mínimo para os testes locais do build. */
import http from "http";
import fs from "fs";
import path from "path";

const raiz = path.resolve("dist");
const tipos = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json" };

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  let arquivo = path.join(raiz, url === "/" ? "index.html" : url);
  if (!fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) arquivo = path.join(raiz, "index.html");
  res.writeHead(200, { "Content-Type": tipos[path.extname(arquivo)] || "application/octet-stream" });
  fs.createReadStream(arquivo).pipe(res);
}).listen(4173, "127.0.0.1", () => console.log("servindo dist em http://127.0.0.1:4173"));
