import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "dist");
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

createServer((request, response) => {
  const pathname = decodeURIComponent((request.url || "/").split("?")[0]);
  const relative = normalize(pathname).replace(/^([.][.][\\/])+/, "");
  const candidate = join(root, relative === "." ? "index.html" : relative);
  const file = existsSync(candidate) && statSync(candidate).isFile() ? candidate : join(root, "index.html");

  response.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
  createReadStream(file).on("error", () => {
    response.writeHead(404);
    response.end("Not found");
  }).pipe(response);
}).listen(port, "0.0.0.0", () => {
  console.log(`Sticky ToDo web server listening on port ${port}`);
});
