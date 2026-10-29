import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tailwindBin = path.join(
  root,
  "node_modules",
  "@tailwindcss",
  "cli",
  "dist",
  "index.mjs"
);
const PORT = Number(process.env.PORT) || 5500;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  const filePath = path.join(root, pathname === "/" ? "index.html" : pathname);

  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" }).end("403");
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not a file");
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": info.size,
      "Cache-Control": "no-store"
    });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("[dev] site disponible sur http://localhost:" + PORT);
});

server.on("error", (error) => {
  console.error("[dev] impossible d'écouter sur le port " + PORT + " : " + error.message);
  shutdown(1);
});

const children = [];
let stopping = false;

function run(args, label) {
  const child = spawn(process.execPath, args, { cwd: root, stdio: "inherit" });
  children.push(child);
  child.on("exit", (code) => {
    if (!stopping) {
      console.error("[" + label + "] processus arrêté (" + code + ")");
      shutdown(code ?? 1);
    }
  });
}

function shutdown(code) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => {
    if (!child.killed) child.kill();
  });
  server.close();
  process.exitCode = code;
}

run(
  [tailwindBin, "-i", "./src/input.css", "-o", "./src/output.css", "--watch"],
  "css"
);
run([path.join(root, "scripts", "watch-docs.mjs")], "docs");

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
