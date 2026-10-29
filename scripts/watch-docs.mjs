import { watch } from "node:fs";
import { buildDocs, sourceRoot } from "./build-docs.mjs";

let timer;
let running = false;
let pending = false;

async function rebuild(reason) {
  if (running) {
    pending = true;
    return;
  }

  running = true;
  try {
    await buildDocs();
    if (reason) console.log("[docs] mise à jour : " + reason);
  } catch (error) {
    console.error("[docs] échec de mise à jour :", error);
  } finally {
    running = false;
    if (pending) {
      pending = false;
      schedule("nouvelle modification");
    }
  }
}

function schedule(reason) {
  clearTimeout(timer);
  timer = setTimeout(() => rebuild(reason), 140);
}

await rebuild("scan initial");

const watcher = watch(sourceRoot, { recursive: true }, (_event, filename) => {
  if (!filename) return;
  schedule(filename.toString());
});

console.log("[docs] écoute de " + sourceRoot + " (Ctrl+C pour arrêter)");

function stop() {
  watcher.close();
  clearTimeout(timer);
  process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
